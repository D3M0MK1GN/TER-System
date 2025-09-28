import { useForm } from "react-hook-form";
import { useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Atom, Upload, FileSpreadsheet, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { insertExperticiasSchema, type Experticia } from "@shared/schema";
import { usePermissions } from "@/hooks/use-permissions";
import { z } from "zod";

const experticiasFormSchema = insertExperticiasSchema.extend({
  createdAt: z.string().optional(),
});

type FormData = z.infer<typeof experticiasFormSchema>;

interface ExperticiasFormProps {
  experticia?: Experticia | null;
  onSubmit: (data: FormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  preloadData?: Partial<FormData> | null;
}

export function ExperticiasForm({ experticia, onSubmit, onCancel, isLoading, preloadData }: ExperticiasFormProps) {
  const isEditing = !!experticia;
  const scrollContainerRef = useRef<HTMLFormElement>(null);
  const permissions = usePermissions();

  // Estado para la subida de archivos
  const [fileUploadState, setFileUploadState] = useState<{
    isUploading: boolean;
    uploadedFile: { name: string; size: string } | null;
    error: string | null;
  }>({
    isUploading: false,
    uploadedFile: null,
    error: null,
  });

  // Estado para los resultados del análisis BTS
  const [btsAnalysisState, setBtsAnalysisState] = useState<{
    isAnalyzing: boolean;
    results: any[] | null;
    error: string | null;
  }>({
    isAnalyzing: false,
    results: null,
    error: null,
  });

  // Helper para formatear tamaño de archivo
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const form = useForm<FormData>({
    resolver: zodResolver(experticiasFormSchema),
    defaultValues: {
      numeroDictamen: experticia?.numeroDictamen || preloadData?.numeroDictamen || "",
      experto: experticia?.experto || preloadData?.experto || "",
      numeroComunicacion: experticia?.numeroComunicacion || preloadData?.numeroComunicacion || "",
      fechaComunicacion: experticia?.fechaComunicacion?.toString() || preloadData?.fechaComunicacion || "",
      motivo: experticia?.motivo || preloadData?.motivo || "",
      operador: experticia?.operador || preloadData?.operador || undefined,
      fechaRespuesta: experticia?.fechaRespuesta?.toString() || preloadData?.fechaRespuesta || "",
      usoHorario: experticia?.usoHorario ?? preloadData?.usoHorario ?? "",
      archivoAdjunto: experticia?.archivoAdjunto ?? preloadData?.archivoAdjunto ?? "",
      nombreArchivo: experticia?.nombreArchivo ?? preloadData?.nombreArchivo ?? "",
      tamañoArchivo: experticia?.tamañoArchivo ?? preloadData?.tamañoArchivo ?? undefined,
      tipoExperticia: experticia?.tipoExperticia || preloadData?.tipoExperticia || "",
      abonado: experticia?.abonado ?? preloadData?.abonado ?? "",
      datosAbonado: experticia?.datosAbonado ?? preloadData?.datosAbonado ?? "",
      conclusion: experticia?.conclusion ?? preloadData?.conclusion ?? "",
      respuestaFechaCorreo: experticia?.respuestaFechaCorreo ?? preloadData?.respuestaFechaCorreo ?? "",
      horaRespuestaCorreo: experticia?.horaRespuestaCorreo ?? preloadData?.horaRespuestaCorreo ?? "",
      expediente: experticia?.expediente || preloadData?.expediente || "",
      estado: experticia?.estado || preloadData?.estado || "procesando",
      usuarioId: experticia?.usuarioId || preloadData?.usuarioId || undefined,
      createdAt: experticia?.createdAt ? new Date(experticia.createdAt).toISOString().split('T')[0] : "",
    },
  });

  // Monitorear campo abonado para habilitar/deshabilitar subida de archivo
  const abonadoValue = form.watch('abonado');

  const handleSubmit = (data: FormData) => {
    if (fileUploadState.isUploading) {
      return; // Prevenir submit durante subida
    }
    onSubmit(data);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const scrollAmount = 80; // Cantidad de scroll en píxeles (más rápido)

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      scrollContainer.scrollTo({
        top: Math.max(0, scrollContainer.scrollTop - scrollAmount),
        behavior: 'smooth'
      });
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      scrollContainer.scrollTo({
        top: Math.min(
          scrollContainer.scrollHeight - scrollContainer.clientHeight,
          scrollContainer.scrollTop + scrollAmount
        ),
        behavior: 'smooth'
      });
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center space-x-2">
          <Atom className="h-5 w-5" />
          <span>{isEditing ? "Editar Experticia" : "Nueva Experticia"}</span>
        </DialogTitle>
      </DialogHeader>

      <Form {...form}>
        <form 
          ref={scrollContainerRef}
          onSubmit={form.handleSubmit(handleSubmit)} 
          onKeyDown={handleKeyDown}
          tabIndex={0}
          className="space-y-6 max-h-[70vh] overflow-y-auto focus:outline-none pr-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#d1d5db transparent'
          }}
        >
          {/* Información básica */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Información Básica</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="numeroDictamen"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nº Dictamen*</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="ej: DICT-2024-001" 
                        {...field} 
                        className="font-mono"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expediente"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expediente*</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="ej: EXP-2024-001" 
                        {...field} 
                        className="font-mono"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="experto"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Experto*</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Nombre del experto asignado" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="numeroComunicacion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nº Comunicación*</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="ej: COM-2024-001" 
                        {...field} 
                        className="font-mono"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fechaComunicacion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>C.Fecha</FormLabel>
                    <FormControl>
                      {permissions.canEditCreationDates ? (
                        <Input 
                          placeholder="dd/mm/yyyy o dd-mm-yyyy" 
                          {...field}
                          value={field.value?.toString() || ''}
                          onKeyDown={(e) => {
                            const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
                            const allowedChars = /[0-9\/\-\s]/;
                            
                            if (allowedKeys.includes(e.key)) {
                              return; // Permitir teclas de navegación
                            }
                            
                            if (!allowedChars.test(e.key)) {
                              e.preventDefault(); // Bloquear letras y otros caracteres
                            }
                          }}
                        />
                      ) : (
                        <div className="flex items-center p-3 border rounded-md bg-gray-50">
                          <span className="text-sm text-gray-600">
                            {field.value?.toString() || 'No establecida'} (Solo administradores pueden editar fechas)
                          </span>
                        </div>
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fechaRespuesta"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>R.Fecha</FormLabel>
                    <FormControl>
                      {permissions.canEditCreationDates ? (
                        <Input 
                          placeholder="dd/mm/yyyy o dd-mm-yyyy" 
                          {...field}
                          value={field.value?.toString() || ''}
                          onKeyDown={(e) => {
                            const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
                            const allowedChars = /[0-9\/\-\s]/;
                            
                            if (allowedKeys.includes(e.key)) {
                              return; // Permitir teclas de navegación
                            }
                            
                            if (!allowedChars.test(e.key)) {
                              e.preventDefault(); // Bloquear letras y otros caracteres
                            }
                          }}
                        />
                      ) : (
                        <div className="flex items-center p-3 border rounded-md bg-gray-50">
                          <span className="text-sm text-gray-600">
                            {field.value?.toString() || 'No establecida'} (Solo administradores pueden editar fechas)
                          </span>
                        </div>
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Detalles de la experticia */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Detalles de la Experticia</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="operador"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Operador*</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar operador" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="digitel">Digitel</SelectItem>
                        <SelectItem value="movistar">Movistar</SelectItem>
                        <SelectItem value="movilnet">Movilnet</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tipoExperticia"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Experticia*</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione tipo de experticia" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="identificar_datos_numero">Identificar datos de un número</SelectItem>
                        <SelectItem value="determinar_historicos_trazas_bts">Determinar Históricos de Trazas Telefónicas BTS</SelectItem>
                        <SelectItem value="determinar_linea_conexion_ip">Determinar línea telefónica con conexión IP</SelectItem>
                        <SelectItem value="identificar_radio_bases_bts">Identificar las Radio Bases (BTS)</SelectItem>
                        <SelectItem value="identificar_numeros_duraciones_bts">Identificar números con duraciones específicas en la Radio Base (BTS)</SelectItem>
                        <SelectItem value="determinar_contaminacion_linea">Determinar contaminación de línea</SelectItem>
                        <SelectItem value="determinar_sim_cards_numero">Determinar SIM CARDS utilizados con un número telefónico</SelectItem>
                        <SelectItem value="determinar_comportamiento_social">Determinar comportamiento social</SelectItem>
                        <SelectItem value="determinar_contacto_frecuente">Determinar Contacto Frecuente</SelectItem>
                        <SelectItem value="determinar_ubicacion_llamadas">Determinar ubicación mediante registros de llamadas</SelectItem>
                        <SelectItem value="determinar_ubicacion_trazas">Determinar ubicación mediante registros de trazas telefónicas (Recorrido)</SelectItem>
                        <SelectItem value="determinar_contaminacion_equipo_imei">Determinar contaminación de equipo (IMEI)</SelectItem>
                        <SelectItem value="identificar_numeros_comun_bts">Identificar números en común en dos o más Radio Base (BTS)</SelectItem>
                        <SelectItem value="identificar_numeros_desconectan_bts">Identificar números que se desconectan de la Radio Base (BTS) después del hecho</SelectItem>
                        <SelectItem value="identificar_numeros_repetidos_bts">Identificar números repetidos en la Radio Base (BTS)</SelectItem>
                        <SelectItem value="determinar_numero_internacional">Determinar número internacional</SelectItem>
                        <SelectItem value="identificar_linea_sim_card">Identificar línea mediante SIM CARD</SelectItem>
                        <SelectItem value="identificar_cambio_simcard_documentos">Identificar Cambio de SIM CARD y Documentos</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="estado"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value ?? undefined}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar estado" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="completada">Completada</SelectItem>
                        <SelectItem value="negativa">Negativa</SelectItem>
                        <SelectItem value="procesando">Procesando</SelectItem>
                        <SelectItem value="qr_ausente">QR Ausente</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="usoHorario"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Uso Horario</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="ej: GMT-4 (Venezuela)" 
                        {...field}
                        value={field.value || ""} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="motivo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motivo*</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Motivo de la solicitud de experticia..."
                      {...field}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Información del abonado */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Información del Abonado</h3>
            
            <FormField
              control={form.control}
              name="datosAbonado"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Datos del Abonado</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Información adicional del abonado (nombre, dirección, etc.)"
                      {...field}
                      value={field.value || ""}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Campo de fecha de creación solo editable por administradores */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Información Administrativa</h3>
            
            <FormField
              control={form.control}
              name="createdAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha de Creación de la Experticia</FormLabel>
                  <FormControl>
                    {permissions.canEditCreationDates ? (
                      <Input
                        type="date"
                        placeholder="Seleccione fecha de creación"
                        {...field}
                        value={field.value || ""}
                      />
                    ) : (
                      <div className="flex items-center p-3 border rounded-md bg-gray-50">
                        <span className="text-sm text-gray-600">
                          {field.value ? 
                            new Date(field.value).toLocaleDateString('es-ES') : 
                            'Fecha automática'
                          } (Solo administradores pueden editar)
                        </span>
                      </div>
                    )}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Archivo y conclusión */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Documentación y Resultados</h3>
            
            <FormField
              control={form.control}
              name="abonado"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Abonado</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Número o identificación del abonado" 
                      {...field}
                      value={field.value || ""} 
                      onKeyDown={(e) => {
                        const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
                        const allowedChars = /[0-9]/;
                        
                        if (allowedKeys.includes(e.key)) {
                          return; // Permitir teclas de navegación
                        }
                        
                        if (!allowedChars.test(e.key)) {
                          e.preventDefault(); // Bloquear todo excepto números
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="archivoAdjunto"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center space-x-2">
                    <Upload className="h-4 w-4" />
                    <span>Adjuntar Archivo</span>
                  </FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <Input 
                        type="file"
                        accept=".xls,.xlsx"
                        disabled={!abonadoValue || fileUploadState.isUploading}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            // Limpiar estado anterior automáticamente
                            setFileUploadState({
                              isUploading: true,
                              uploadedFile: null,
                              error: null,
                            });

                            try {
                              const formData = new FormData();
                              formData.append('archivo', file);
                              
                              const response = await fetch('/api/experticias/upload-archivo', {
                                method: 'POST',
                                headers: {
                                  'Authorization': `Bearer ${localStorage.getItem('token')}`,
                                },
                                body: formData,
                              });
                              
                              if (response.ok) {
                                const result = await response.json();
                                field.onChange(result.archivo.rutaArchivo);
                                form.setValue('nombreArchivo', result.archivo.nombreArchivo);
                                form.setValue('tamañoArchivo', result.archivo.tamañoArchivo);
                                
                                setFileUploadState({
                                  isUploading: false,
                                  uploadedFile: {
                                    name: result.archivo.nombreArchivo,
                                    size: formatFileSize(result.archivo.tamañoArchivo),
                                  },
                                  error: null,
                                });

                                // Análisis automático BTS después de subir archivo
                                if (abonadoValue) {
                                  setBtsAnalysisState({
                                    isAnalyzing: true,
                                    results: null,
                                    error: null,
                                  });

                                  try {
                                    const analysisResponse = await fetch('/api/experticias/analizar-bts', {
                                      method: 'POST',
                                      headers: {
                                        'Content-Type': 'application/json',
                                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                                      },
                                      body: JSON.stringify({
                                        archivo_excel: result.archivo.rutaArchivo,
                                        numero_buscar: abonadoValue,
                                        operador: form.getValues('operador'), // <-- AGREGA ESTA LÍNEA
                                      }),
                                    });

                                    if (analysisResponse.ok) {
                                      const analysisResult = await analysisResponse.json();
                                      setBtsAnalysisState({
                                        isAnalyzing: false,
                                        results: analysisResult.data || [],
                                        error: null,
                                      });
                                    } else {
                                      setBtsAnalysisState({
                                        isAnalyzing: false,
                                        results: null,
                                        error: 'Error en el análisis BTS',
                                      });
                                    }
                                  } catch (analysisError) {
                                    setBtsAnalysisState({
                                      isAnalyzing: false,
                                      results: null,
                                      error: 'Error de conexión al analizar BTS',
                                    });
                                  }
                                }
                              } else {
                                const errorText = await response.text();
                                field.onChange('');
                                setFileUploadState({
                                  isUploading: false,
                                  uploadedFile: null,
                                  error: errorText || 'Error subiendo archivo',
                                });
                              }
                            } catch (error) {
                              field.onChange('');
                              setFileUploadState({
                                isUploading: false,
                                uploadedFile: null,
                                error: 'Error de conexión al subir archivo',
                              });
                            }
                          }
                        }}
                        className={`file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium ${
                          fileUploadState.uploadedFile ? 'border-green-500' : 
                          fileUploadState.error ? 'border-red-500' : ''
                        }`}
                      />
                      
                      {/* Estado de subida */}
                      {fileUploadState.isUploading && (
                        <div className="flex items-center space-x-2 text-sm text-blue-600">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Subiendo archivo...</span>
                        </div>
                      )}
                      
                      {/* Archivo subido exitosamente */}
                      {fileUploadState.uploadedFile && (
                        <div className="flex items-center space-x-2 text-sm text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          <FileSpreadsheet className="h-4 w-4" />
                          <span>{fileUploadState.uploadedFile.name}</span>
                          <span className="text-gray-500">({fileUploadState.uploadedFile.size})</span>
                        </div>
                      )}
                      
                      {/* Error en subida */}
                      {fileUploadState.error && (
                        <div className="flex items-center space-x-2 text-sm text-red-600">
                          <XCircle className="h-4 w-4" />
                          <span>{fileUploadState.error}</span>
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <p className="text-sm text-gray-600">
                    Formatos permitidos: XLS, XLSX
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Resultados del análisis BTS */}
            {(btsAnalysisState.isAnalyzing || btsAnalysisState.results || btsAnalysisState.error) && (
              <div className="space-y-3 border-t pt-4">
                <h4 className="text-md font-medium">Análisis BTS</h4>
                
                {/* Estado de análisis */}
                {btsAnalysisState.isAnalyzing && (
                  <div className="flex items-center space-x-2 text-sm text-blue-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Analizando archivo BTS...</span>
                  </div>
                )}
                
                {/* Error en análisis */}
                {btsAnalysisState.error && (
                  <div className="flex items-center space-x-2 text-sm text-red-600">
                    <XCircle className="h-4 w-4" />
                    <span>{btsAnalysisState.error}</span>
                  </div>
                )}
                
                {/* Resultados del análisis */}
                {btsAnalysisState.results && btsAnalysisState.results.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm text-green-600 font-medium">
                      Resultados encontrados: {btsAnalysisState.results.length}
                    </div>
                    <div className="max-h-60 overflow-y-auto border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>ABONADO A</TableHead>
                            <TableHead>ABONADO B</TableHead>
                            <TableHead>FECHA</TableHead>
                            <TableHead>HORA</TableHead>
                            <TableHead>TIME</TableHead>
                            <TableHead>DIRECCION</TableHead>
                            <TableHead>CORDENADAS</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {btsAnalysisState.results.map((result, index) => (
                            <TableRow key={index}>
                              <TableCell>{result['ABONADO A'] || '-'}</TableCell>
                              <TableCell>{result['ABONADO B'] || '-'}</TableCell>
                              <TableCell>{result['FECHA'] || '-'}</TableCell>
                              <TableCell>{result['HORA'] || '-'}</TableCell>
                              <TableCell>{result['TIME'] || '-'}</TableCell>
                              <TableCell>{result['DIRECCION'] || '-'}</TableCell>
                              <TableCell>{result['CORDENADAS'] || '-'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
                
                {/* Sin resultados */}
                {btsAnalysisState.results && btsAnalysisState.results.length === 0 && (
                  <div className="text-sm text-gray-600">
                    No se encontraron resultados para el número {abonadoValue}
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="respuestaFechaCorreo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Respuesta de Fecha del Correo</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="dd/mm/yyyy o dd-mm-yyyy"
                        {...field}
                        value={field.value || ""}
                        onKeyDown={(e) => {
                          const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
                          const allowedChars = /[0-9\/\-\s]/;
                          
                          if (allowedKeys.includes(e.key)) {
                            return; // Permitir teclas de navegación
                          }
                          
                          if (!allowedChars.test(e.key)) {
                            e.preventDefault(); // Bloquear letras y otros caracteres
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="horaRespuestaCorreo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hora</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="HH:MM (ej: 14:30)"
                        {...field}
                        value={field.value || ""}
                        onKeyDown={(e) => {
                          const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
                          const allowedChars = /[0-9:]/;
                          
                          if (allowedKeys.includes(e.key)) {
                            return; // Permitir teclas de navegación
                          }
                          
                          if (!allowedChars.test(e.key)) {
                            e.preventDefault(); // Bloquear letras y otros caracteres
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="conclusion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Conclusión</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Conclusiones y resultados de la experticia..."
                      {...field}
                      value={field.value || ""}
                      rows={4}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-6 border-t">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Guardando..." : isEditing ? "Actualizar" : "Crear"}
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
}