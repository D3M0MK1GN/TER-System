// Rutas para gestión de documentos (Word y Excel)
import type { Express } from "express";
import { writeFileSync, readFileSync, existsSync, mkdirSync, unlinkSync } from "fs";
import path from "path";
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const XLSX = require('xlsx');

// Al inicio del archivo routes_gest.ts
const swiPdf = {
  downloadAsPdf: false,
  // otros valores de configuración...
};

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
        OFI: (requestData.coordinacionSolicitante.includes('delitos_propiedad')) 
           ? 'CIDCPROP' 
           : (requestData.coordinacionSolicitante.includes('delitos_personas')) 
           ? 'CIDCPER' 
           : (requestData.coordinacionSolicitante.includes('crimen_organizado')) 
           ? 'COLOCAR IDENTIFICADOR'
           : (requestData.coordinacionSolicitante.includes('delitos_vehiculos')) 
           ? 'CIRHV'
           : (requestData.coordinacionSolicitante.includes('homicidio')) 
           ? 'CIDCPER'
           : 'IDENTIFICAR OFICINA POR FAVOR!!!',  // Valor por defecto,

        SOLICITUD: solicitudShort,
        EXP: requestData.numeroExpediente || '',
        OPER: (requestData.operador || '').toUpperCase(),
        FECHA: currentDate,
        FISCAL: requestData.fiscal || '',
        DIR: requestData.direc || '',
        INFO_E: requestData.informacionE || '',
        INFO_R: requestData.informacionR || '',
        DESDE: requestData.desde || '',
        HASTA: requestData.hasta || '',
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
      console.log("Generando Excel con datos:", requestData);
      
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
      
      // Determinar oficina basada en coordinación
      const oficina = (requestData.coordinacionSolicitante.includes('delitos_propiedad')) 
         ? 'CIDCPROP' 
         : (requestData.coordinacionSolicitante.includes('delitos_personas')) 
         ? 'CIDCPER' 
         : (requestData.coordinacionSolicitante.includes('crimen_organizado')) 
         ? 'CRIMEN ORGANIZADO'
         : (requestData.coordinacionSolicitante.includes('delitos_vehiculos')) 
         ? 'CIRHV'
         : (requestData.coordinacionSolicitante.includes('homicidio')) 
         ? 'CIDCPER'
         : 'OFICINA NO IDENTIFICADA';

      // Leer la plantilla Excel
      console.log("Leyendo plantilla Excel...");
      const workbook = XLSX.readFile(excelTemplatePath);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      console.log("Plantilla Excel leída exitosamente");

      // Mapear datos a celdas específicas según la estructura real de la plantilla
      const dataMapping = {
        'B2': solicitudShort,                   // {SOLICITUD}
        'C2': currentDate,                      // {FECHA}
        'D2': oficina,                          // {DM} - Despacho/Oficina
        'E2': requestData.numeroExpediente || '', // {EXP} - Expediente
        'F2': requestData.informacionR || '',   // {INFO_R} - Dato Solicitado
        'G2': requestData.desde || '',          // {DESDE}
        'H2': requestData.hasta || '',          // {HASTA}
        'J2': requestData.delito || '',         // {delito}
      };

      // Aplicar los datos a las celdas
      Object.entries(dataMapping).forEach(([cell, value]) => {
        if (value !== undefined && value !== null) {
          worksheet[cell] = { v: value, t: 's' }; // 's' indica que es string
        }
      });

      // Generar el buffer del archivo Excel modificado
      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

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