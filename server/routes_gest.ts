// Rutas para gestión de documentos (Word y Excel)
import type { Express } from "express";
import { writeFileSync, readFileSync, existsSync, mkdirSync, unlinkSync } from "fs";
import path from "path";
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import ExcelJS from 'exceljs';
import { parseWithPrefixes } from '../tools/utils_I';

// Al inicio del archivo routes_gest.ts
const swiPdf = {
  downloadAsPdf: false,
  // otros valores de configuración...
};

// Funciones reutilizables para generación de documentos
export async function generateWordDocument(requestData: any, storage: any): Promise<Buffer | null> {
  try {
    const { tipoExperticia } = requestData;
    
    // 1. Validar existencia de plantilla y archivo
    const plantilla = await storage.getPlantillaWordByTipoExperticia(tipoExperticia);
    if (!plantilla || !existsSync(plantilla.archivo)) {
      return null;
    }
    
    // 2. Preparar datos para la plantilla
    const currentDate = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' });
    const solicitudShort = requestData.numeroSolicitud?.split('-').pop() || requestData.numeroSolicitud || '';

    const templateData = {
      OFI: (requestData.coordinacionSolicitante && requestData.coordinacionSolicitante.includes('delitos_propiedad')) 
         ? 'CIDCPROP' 
         : (requestData.coordinacionSolicitante && requestData.coordinacionSolicitante.includes('delitos_personas')) 
         ? 'CIDCPER' 
         : (requestData.coordinacionSolicitante && requestData.coordinacionSolicitante.includes('crimen_organizado')) 
         ? 'COLOCAR IDENTIFICADOR'
         : (requestData.coordinacionSolicitante && requestData.coordinacionSolicitante.includes('delitos_vehiculos')) 
         ? 'CIRHV'
         : (requestData.coordinacionSolicitante && requestData.coordinacionSolicitante.includes('homicidio')) 
         ? 'CIDCPER'
         : 'IDENTIFICAR OFICINA POR FAVOR!!!',
      SOLICITUD: solicitudShort,
      EXP: requestData.numeroExpediente || '',
      OPER: (requestData.operador || '').toUpperCase(),
      FECHA: currentDate,
      FISCAL: requestData.fiscal || '',
      DIR: requestData.direc || '',
      INFO_E: requestData.informacionLinea || '',
      INFO_R: requestData.descripcion || '',
      DESDE: requestData.fechaSolicitud || '',
      HASTA: requestData.fechaRespuesta || '',
      DELITO: requestData.delito || '',
    };

    // 3. Generar documento
    const content = readFileSync(plantilla.archivo, 'binary');
    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    doc.render(templateData);
    return doc.getZip().generate({ type: 'nodebuffer' });
    
  } catch (error) {
    console.error("Error generando documento Word:", error);
    return null;
  }
}

export async function generateExcelDocument(requestData: any): Promise<Buffer | null> {
  try {
    // Verificar que existe la plantilla Excel
    const excelTemplatePath = path.join(process.cwd(), 'uploads', 'PLANILLA DATOS.xlsx');
    if (!existsSync(excelTemplatePath)) {
      return null;
    }

    // Preparar datos para la plantilla
    const currentDate = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' });
    const solicitudShort = requestData.numeroSolicitud?.split('-').pop() || requestData.numeroSolicitud || '';
    
    // Leer la plantilla Excel con ExcelJS
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(excelTemplatePath);
    const worksheet = workbook.getWorksheet(1);
    
    if (!worksheet) {
      return null;
    }

    // Generar mapeo de datos específico según el tipo de experticia
    let dataMappings = [];
    
    if (requestData.tipoExperticia === 'identificar_radio_bases_bts') {
      // Para BTS: dos filas con los mismos datos, excepto columna F
      dataMappings = [
        {
          'B2': solicitudShort,
          'C2': currentDate,
          'D2': 'Delegacion Municipal Quibor',
          'E2': requestData.numeroExpediente || '',
          'F2': requestData.informacionLinea || '',
          'G2': requestData.fechaSolicitud || '',
          'H2': requestData.fechaRespuesta || '',
          'J2': requestData.delito || '',
          'K2': requestData.fiscal || '',
        },
        {
          'B3': solicitudShort,
          'C3': currentDate,
          'D3': 'Delegacion Municipal Quibor',
          'E3': requestData.numeroExpediente || '',
          'F3': requestData.direc || '',
          'G3': requestData.fechaSolicitud || '',
          'H3': requestData.fechaRespuesta || '',
          'J3': requestData.delito || '',
          'K3': requestData.fiscal || '',
        }
      ];
    } else {
      // Para otros tipos de experticia: comportamiento normal (una sola fila)
      dataMappings = [
        {
          'B2': solicitudShort,
          'C2': currentDate,
          'D2': 'Delegacion Municipal Quibor',
          'E2': requestData.numeroExpediente || '',
          'F2': requestData.informacionLinea || '',
          'G2': requestData.fechaSolicitud || '',
          'H2': requestData.fechaRespuesta || '',
          'J2': requestData.delito || '',
          'K2': requestData.fiscal || '',
        }
      ];
    }

    // Aplicar los datos a las celdas preservando el formato
    dataMappings.forEach(dataMapping => {
      Object.entries(dataMapping).forEach(([cellAddress, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          const cell = worksheet.getCell(cellAddress);
          cell.value = String(value);
        }
      });
    });

    // Generar el buffer del archivo Excel modificado
    const arrayBuffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(arrayBuffer);
    
  } catch (error) {
    console.error("Error generando archivo Excel:", error);
    return null;
  }
}

export function registerDocumentRoutes(app: Express, authenticateToken: any, storage: any) {
  
  // Configuration route for PDF/Word format selection
  app.post("/api/config/download-format", authenticateToken, async (req: any, res) => {
    const { downloadAsPdf } = req.body;
    swiPdf.downloadAsPdf = downloadAsPdf;
    res.json({ success: true, downloadAsPdf });
  });
  
  // Ruta para generar plantilla Word personalizada
  app.post("/api/plantillas-word/by-expertise/:tipoExperticia/generate", authenticateToken, async (req: any, res) => {
    try {
      const { tipoExperticia } = req.params;
      const requestData = req.body;

      // 1. Validar existencia de plantilla y archivo (más conciso)
      const plantilla = await storage.getPlantillaWordByTipoExperticia(tipoExperticia);
      if (!plantilla) {
        return res.status(404).json({ message: "No hay plantilla disponible para este tipo de experticia" });
      }
      if (!existsSync(plantilla.archivo)) {
        return res.status(404).json({ message: "Archivo de plantilla no encontrado" });
      }
      
      // 2. Preparar datos para la plantilla
      const currentDate = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' });
      const solicitudShort = requestData.numeroSolicitud?.split('-').pop() || requestData.numeroSolicitud || '';

      const templateData = {
        // Uso de un único estilo de nombre para los placeholders
        OFI: (requestData.coordinacionSolicitante && requestData.coordinacionSolicitante.includes('delitos_propiedad')) 
           ? 'CIDCPROP' 
           : (requestData.coordinacionSolicitante && requestData.coordinacionSolicitante.includes('delitos_personas')) 
           ? 'CIDCPER' 
           : (requestData.coordinacionSolicitante && requestData.coordinacionSolicitante.includes('crimen_organizado')) 
           ? 'COLOCAR IDENTIFICADOR'
           : (requestData.coordinacionSolicitante && requestData.coordinacionSolicitante.includes('delitos_vehiculos')) 
           ? 'CIRHV'
           : (requestData.coordinacionSolicitante && requestData.coordinacionSolicitante.includes('homicidio')) 
           ? 'CIDCPER'
           : 'IDENTIFICAR OFICINA POR FAVOR!!!',  // Valor por defecto,

        SOLICITUD: solicitudShort,
        EXP: requestData.numeroExpediente || '',
        OPER: (requestData.operador || '').toUpperCase(),
        FECHA: currentDate,
        FISCAL: requestData.fiscal || '',
        DIR: requestData.direc || '',
        INFO_E: requestData.informacionLinea || '',
        INFO_R: requestData.descripcion || '',
        DESDE: requestData.fechaSolicitud || '',
        HASTA: requestData.fechaRespuesta || '',
        DELITO: requestData.delito || '',
      };

      let busArhivo: Buffer; // Variable para almacenar el buffer del archivo a enviar
      
      // Colocar Condicional Aquí
      if (swiPdf.downloadAsPdf) {
        console.log("PDF ListoS");
        return res.status(200).json({ message: "Se solicitó la generación de PDF." });
      } else {
        try {
          // Leer el archivo de la plantilla
          const content = readFileSync(plantilla.archivo, 'binary');
          const zip = new PizZip(content);
          const doc = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
          });

          // Generar Documento con Datos
          doc.render(templateData);

          // Obtener el buffer del documento generado con los datos
          busArhivo = doc.getZip().generate({ type: 'nodebuffer' });

        } catch (renderError: any) {
          // Si el renderizado falla, registramos el error y usamos la plantilla original
          console.error("Error al renderizar la plantilla con docxtemplater:", renderError);
          busArhivo = readFileSync(plantilla.archivo); // Usar la plantilla original
        }
        
        // 3. Configurar y enviar la respuesta (consolidado) (Nombre)
        const customFileName = `${plantilla.nombre}-${requestData.numeroSolicitud || 'plantilla'}.docx`;
        console.log("WORD ListoS");
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename="${customFileName}"`);
        res.send(busArhivo);
      }

    } catch (error) {
      // Manejo de errores generales (ej. problemas de base de datos o acceso a archivos antes del renderizado)
      res.status(500).json({ message: "Error generando plantilla personalizada" });
    }
  });

  // Ruta para generar archivo Excel con datos de solicitud
  app.post("/api/solicitudes/generate-excel", authenticateToken, async (req: any, res) => {
    try {
      const requestData = req.body;
      console.log("=== INICIO GENERACIÓN EXCEL ===");
      console.log("Datos recibidos:", JSON.stringify(requestData, null, 2));
      console.log("Tipo de datos:", typeof requestData);
      console.log("Keys disponibles:", Object.keys(requestData || {}));
      
      // Verificar que existe la plantilla Excel
      const excelTemplatePath = path.join(process.cwd(), 'uploads', 'PLANILLA DATOS.xlsx');
      console.log("Buscando plantilla en:", excelTemplatePath);
      if (!existsSync(excelTemplatePath)) {
        console.log("Plantilla Excel no encontrada");
        return res.status(404).json({ message: "Plantilla Excel no encontrada" });
      }

      // Preparar datos para la plantilla
      const currentDate = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' });
      const solicitudShort = requestData.numeroSolicitud?.split('-').pop() || requestData.numeroSolicitud || '';
      
      // Parsear información de línea para extraer e: y r:
      const parsedLinea = parseWithPrefixes(requestData.informacionLinea || '', ['e', 'r']);
      
      // Parsear fecha de solicitud para extraer desde: y hasta:
      const parsedFechas = parseWithPrefixes(requestData.fecha_de_solicitud || '', ['desde', 'hasta']);
      
      // Determinar oficina basada en coordinación
      /*const oficina = (requestData.coordinacionSolicitante.includes('delitos_propiedad')) 
         ? 'CIDCPROP' 
         : (requestData.coordinacionSolicitante.includes('delitos_personas')) 
         ? 'CIDCPER' 
         : (requestData.coordinacionSolicitante.includes('crimen_organizado')) 
         ? 'CRIMEN ORGANIZADO'
         : (requestData.coordinacionSolicitante.includes('delitos_vehiculos')) 
         ? 'CIRHV'
         : (requestData.coordinacionSolicitante.includes('homicidio')) 
         ? 'CIDCPER'
         : 'OFICINA NO IDENTIFICADA';*/

      // Leer la plantilla Excel con ExcelJS para preservar formato
      console.log("Leyendo plantilla Excel con ExcelJS...");
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(excelTemplatePath);
      const worksheet = workbook.getWorksheet(1); // Primera hoja
      
      if (!worksheet) {
        console.log("No se pudo acceder a la hoja de trabajo");
        return res.status(500).json({ message: "Error accediendo a la hoja de trabajo Excel" });
      }
      
      console.log("Plantilla Excel leída exitosamente con formato preservado");

      // Generar mapeo de datos específico según el tipo de experticia
      let dataMappings = [];
      
      if (requestData.tipoExperticia === 'identificar_radio_bases_bts') {
        // Para BTS: dos filas con los mismos datos, excepto columna F
        dataMappings = [
          {
            'B2': solicitudShort,                   // {SOLICITUD}
            'C2': currentDate,                      // {FECHA}
            'D2': 'Delegacion Municipal Quibor',    // {DM} - Despacho/Oficina
            'E2': requestData.numeroExpediente || '', // {EXP} - Expediente
            'F2': requestData.direc || '',          // {DIREC} - Dirección (primera fila)
            'G2': parsedFechas.desde || '',          // {DESDE}
            'H2': parsedFechas.hasta || '',          // {HASTA}
            'J2': requestData.delito || '',         // {delito}
            'K2': requestData.fiscal || '',
          },
          {
            'B3': solicitudShort,                   // {SOLICITUD}
            'C3': currentDate,                      // {FECHA}
            'D3': 'Delegacion Municipal Quibor',    // {DM} - Despacho/Oficina
            'E3': requestData.numeroExpediente || '', // {EXP} - Expediente
            'F3': parsedLinea.e || parsedLinea.r || requestData.informacionLinea || '',   // {INFO_E} - Información de línea (segunda fila)
            'G3': parsedFechas.desde || '',          // {DESDE}
            'H3': parsedFechas.hasta || '',          // {HASTA}
            'J3': requestData.delito || '',         // {delito}
            'K3': requestData.fiscal || '',
          }
        ];
      } else {
        // Para otros tipos de experticia: comportamiento normal (una sola fila)
        dataMappings = [
          {
            'B2': solicitudShort,                   // {SOLICITUD}
            'C2': currentDate,                      // {FECHA}
            'D2': 'Delegacion Municipal Quibor',    // {DM} - Despacho/Oficina
            'E2': requestData.numeroExpediente || '', // {EXP} - Expediente
            'F2': requestData.informacionLinea || '',   // {INFO_E} - Dato Solicitado
            'G2': parsedFechas.desde || '',          // {DESDE}
            'H2': parsedFechas.hasta || '',          // {HASTA}
            'J2': requestData.delito || '',         // {delito}
            'K2': requestData.fiscal || '',
          }
        ];
      }

      console.log("Mapeo de datos para Excel:", JSON.stringify(dataMappings, null, 2));

      // Aplicar los datos a las celdas preservando el formato
      dataMappings.forEach(dataMapping => {
        Object.entries(dataMapping).forEach(([cellAddress, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            const cell = worksheet.getCell(cellAddress);
            cell.value = String(value);
            // El formato y estilo de la celda se preserva automáticamente
          } else {
            //console.log(`Saltando celda ${cellAddress} - valor vacío o nulo:`, value);
          }
        });
      });

      // Generar el buffer del archivo Excel modificado
      //console.log("Generando buffer Excel con formato preservado...");
      const arrayBuffer = await workbook.xlsx.writeBuffer();
      const excelBuffer = Buffer.from(arrayBuffer);

      // Configurar respuesta para descarga
      const customFileName = `PLANILLA_DATOS-${requestData.numeroSolicitud || 'solicitud'}.xlsx`;
      
      console.log("EXCEL LISTO - enviando archivo:", customFileName);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${customFileName}"`);
      res.send(excelBuffer);

    } catch (error) {
      console.error("Error generando archivo Excel:", error);
      res.status(500).json({ message: "Error generando archivo Excel" });
    }
  });
}