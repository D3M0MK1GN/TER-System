import { useForm } from "react-hook-form";
import { useRef, useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Atom,
  Upload,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  Loader2,
  Eye,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { insertExperticiasSchema, type Experticia } from "@shared/schema";
import { usePermissions } from "@/hooks/use-permissions";
import {
  OPERATORS,
  STATUSES,
  EXPERTICIA_TYPES,
  ALLOWED_KEYS,
  CHAR_PATTERNS,
  handleDateInputKeyDown,
  extractSelectedRows,
} from "@/lib/experticia-utils";
import { z } from "zod";

// Esquema de validación para el formulario de experticias
// Extiende el esquema base con un campo createdAt opcional
const experticiasFormSchema = insertExperticiasSchema.extend({
  createdAt: z.string().optional(),
});

// Tipo de datos del formulario (inferido del esquema Zod)
type FormData = z.infer<typeof experticiasFormSchema>;

/**
 * Props para el componente ExperticiasForm
 * @property experticia - Experticia a editar (si es null, es modo creación; si id es undefined, es modo duplicación)
 * @property onSubmit - Callback cuando se envía el formulario
 * @property onCancel - Callback para cancelar y cerrar el formulario
 * @property isLoading - Indica si hay operación en curso (deshabilita botón submit)
 * @property preloadData - Datos precargados para inicializar campos
 */
interface ExperticiasFormProps {
  experticia?: Experticia | null;
  onSubmit: (data: FormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  preloadData?: Partial<FormData> | null;
}

/**
 * Componente: Formulario para crear, editar o duplicar experticias
 *
 * Funcionalidades principales:
 * - Creación de nuevas experticias
 * - Edición de experticias existentes
 * - Duplicación de experticias
 * - Subida de archivos Excel (análisis BTS)
 * - Selección de filas del análisis BTS
 * - Validación de campos con Zod
 */
export function ExperticiasForm({
  experticia,
  onSubmit,
  onCancel,
  isLoading,
  preloadData,
}: ExperticiasFormProps) {
  // Detecta modo de operación
  const isEditing = !!experticia?.id; // true si estamos editando
  const isDuplicating = !!experticia && !experticia.id; // true si estamos duplicando
  const scrollContainerRef = useRef<HTMLFormElement>(null); // Ref para scroll suave del formulario
  const permissions = usePermissions(); // Permisos del usuario (ej: canEditCreationDates)
  const { toast } = useToast();

  /**
   * Estado para la subida de archivos Excel
   * - isUploading: indica si hay carga en progreso
   * - uploadedFile: nombre y tamaño del archivo subido (null si no hay)
   * - error: mensaje de error si la carga falla
   */
  const [fileUploadState, setFileUploadState] = useState<{
    isUploading: boolean;
    uploadedFile: { name: string; size: string } | null;
    error: string | null;
  }>({
    isUploading: false,
    uploadedFile: null,
    error: null,
  });

  /**
   * Estado para los resultados del análisis BTS (Base Transceptora Sistema)
   * - isAnalyzing: true mientras se procesa el archivo
   * - results: array de filas del análisis (null si no hay análisis)
   * - error: mensaje de error si el análisis falla
   */
  const [btsAnalysisState, setBtsAnalysisState] = useState<{
    isAnalyzing: boolean;
    results: any[] | null;
    error: string | null;
  }>({
    isAnalyzing: false,
    results: null,
    error: null,
  });

  /**
   * Estado para los resultados del análisis de Contactos Frecuentes
   * - isAnalyzing: true mientras se procesa el archivo
   * - datosCrudos: array de filas del Excel (primeras 6 columnas)
   * - top10Contactos: TOP 10 números con mayor frecuencia
   * - error: mensaje de error si el análisis falla
   */
  const [contactosFrecuentesState, setContactosFrecuentesState] = useState<{
    isAnalyzing: boolean;
    datosCrudos: any[] | null;
    top10Contactos: any[] | null;
    error: string | null;
  }>({
    isAnalyzing: false,
    datosCrudos: null,
    top10Contactos: null,
    error: null,
  });

  // Controla si el modal expandido de resultados BTS está abierto
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);

  // Controla si el modal expandido de contactos frecuentes está abierto
  const [isContactosTableModalOpen, setIsContactosTableModalOpen] =
    useState(false);

  /**
   * Estado para la gestión multi-target (múltiples números y archivos)
   */
  const [listaAnalisis, setListaAnalisis] = useState<
    Array<{
      id: string;
      numero: string;
      archivoNombre: string;
      archivoData: string;
      operador: string;
      resultados: {
        bts?: any[];
        contactos?: {
          datosCrudos: any[];
          top10: any[];
        };
      } | null;
    }>
  >([]);

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  /**
   * Agrega un nuevo análisis a la lista temporal
   */
  const agregarAnalisis = async (
    numero: string,
    file: File,
    operador: string
  ) => {
    if (!numero || !file) return;

    if (listaAnalisis.length >= 10) {
      toast({
        title: "Límite alcanzado",
        description: "Solo se permiten hasta 10 registros por experticia.",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = (e.target?.result as string).split(",")[1];
      const nuevoItem = {
        id: Math.random().toString(36).substr(2, 9),
        numero,
        archivoNombre: file.name,
        archivoData: base64,
        operador,
        resultados: null,
      };

      setListaAnalisis((prev) => [...prev, nuevoItem]);
      // Si es el primero, lo seleccionamos
      if (listaAnalisis.length === 0) setSelectedIndex(0);
    };
    reader.readAsDataURL(file);
  };

  /**
   * Procesa todos los análisis en la lista
   */
  const procesarTodosLosAnalisis = async () => {
    if (listaAnalisis.length === 0) return;

    setBtsAnalysisState((prev) => ({ ...prev, isAnalyzing: true }));
    setContactosFrecuentesState((prev) => ({ ...prev, isAnalyzing: true }));

    const nuevaLista = [...listaAnalisis];

    for (let i = 0; i < nuevaLista.length; i++) {
      const item = nuevaLista[i];
      if (item.resultados) continue; // Ya procesado

      try {
        if (tipoExperticiaValue === "determinar_contacto_frecuente") {
          const res = await fetch("/api/analizar-contactos-frecuentes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              archivo_excel: item.archivoNombre,
              archivo_base64: item.archivoData,
              numero_buscar: item.numero,
              operador: item.operador,
            }),
          });
          const data = await res.json();
          if (data.success) {
            nuevaLista[i].resultados = {
              contactos: {
                datosCrudos: data.datos_crudos,
                top10: data.top_10_contactos,
              },
            };
          }
        } else {
          // Lógica para BTS normal
          const res = await fetch("/api/analizar-bts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              archivo_excel: item.archivoNombre,
              archivo_base64: item.archivoData,
              numero_buscar: item.numero,
              operador: item.operador,
            }),
          });
          const data = await res.json();
          if (data.success) {
            nuevaLista[i].resultados = { bts: data.data };
          }
        }
      } catch (err) {
        console.error("Error analizando item:", item.numero, err);
      }
    }

    setListaAnalisis(nuevaLista);
    setBtsAnalysisState((prev) => ({ ...prev, isAnalyzing: false }));
    setContactosFrecuentesState((prev) => ({ ...prev, isAnalyzing: false }));
  };

  /**
   * Hook: Efecto para sincronizar los estados de visualización con el item seleccionado
   */
  useEffect(() => {
    if (selectedIndex !== null && listaAnalisis[selectedIndex]) {
      const item = listaAnalisis[selectedIndex];
      if (item.resultados) {
        if (item.resultados.bts) {
          setBtsAnalysisState({
            isAnalyzing: false,
            results: item.resultados.bts,
            error: null,
          });
        }
        if (item.resultados.contactos) {
          setContactosFrecuentesState({
            isAnalyzing: false,
            datosCrudos: item.resultados.contactos.datosCrudos,
            top10Contactos: item.resultados.contactos.top10,
            error: null,
          });
        }
      }
    }
  }, [selectedIndex, listaAnalisis]);

  // Set de índices de filas seleccionadas en la tabla de resultados BTS
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

  /**
   * Alterna la selección de una fila en la tabla BTS
   * Agrega o elimina el índice del set de filas seleccionadas
   */
  const toggleRowSelection = (index: number) => {
    setSelectedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  /**
   * Effect: Carga datos guardados cuando se edita una experticia
   * Si la experticia tiene datosSeleccionados (filas previas), los restaura
   * y marca todas las filas como seleccionadas por defecto
   */
  useEffect(() => {
    if (
      experticia?.datosSeleccionados &&
      Array.isArray(experticia.datosSeleccionados)
    ) {
      const datosGuardados = experticia.datosSeleccionados as any[];
      if (datosGuardados.length > 0) {
        // Restaura resultados previos del análisis BTS
        setBtsAnalysisState({
          isAnalyzing: false,
          results: datosGuardados,
          error: null,
        });
        // Auto-selecciona todas las filas restauradas
        const allIndices = new Set(datosGuardados.map((_, index) => index));
        setSelectedRows(allIndices);
      }
    }
  }, [experticia?.datosSeleccionados]);

  /**
   * Convierte bytes a formato legible (Bytes, KB, MB, GB)
   * @param bytes - Tamaño en bytes
   * @returns String formateado ej: "2.45 MB"
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  /**
   * Hook: Inicializa el formulario con react-hook-form
   * - Usa Zod para validar todos los campos
   * - Carga valores previos de experticia o preloadData
   * - Mantiene sincronización automática entre estado y UI
   */
  const form = useForm<FormData>({
    resolver: zodResolver(experticiasFormSchema),
    defaultValues: {
      // Prioridad: experticia > preloadData > valor vacío/default
      numeroDictamen:
        experticia?.numeroDictamen || preloadData?.numeroDictamen || "",
      experto: experticia?.experto || preloadData?.experto || "",
      numeroComunicacion:
        experticia?.numeroComunicacion || preloadData?.numeroComunicacion || "",
      fechaComunicacion:
        experticia?.fechaComunicacion?.toString() ||
        preloadData?.fechaComunicacion ||
        "",
      motivo: experticia?.motivo || preloadData?.motivo || "",
      operador: experticia?.operador || preloadData?.operador || undefined,
      fechaRespuesta:
        experticia?.fechaRespuesta?.toString() ||
        preloadData?.fechaRespuesta ||
        "",
      archivoAdjunto:
        experticia?.archivoAdjunto ?? preloadData?.archivoAdjunto ?? "",
      nombreArchivo:
        experticia?.nombreArchivo ?? preloadData?.nombreArchivo ?? "",
      tamañoArchivo:
        experticia?.tamañoArchivo ?? preloadData?.tamañoArchivo ?? undefined,
      tipoExperticia:
        experticia?.tipoExperticia || preloadData?.tipoExperticia || "",
      abonado: experticia?.abonado ?? preloadData?.abonado ?? "",
      datosAbonado: experticia?.datosAbonado ?? preloadData?.datosAbonado ?? "",
      conclusion: experticia?.conclusion ?? preloadData?.conclusion ?? "",
      respuestaFechaCorreo:
        experticia?.respuestaFechaCorreo ??
        preloadData?.respuestaFechaCorreo ??
        "",
      horaRespuestaCorreo:
        experticia?.horaRespuestaCorreo ??
        preloadData?.horaRespuestaCorreo ??
        "",
      expediente: experticia?.expediente || preloadData?.expediente || "",
      estado: experticia?.estado || preloadData?.estado || "procesando",
      usuarioId: experticia?.usuarioId || preloadData?.usuarioId || undefined,
      createdAt: experticia?.createdAt
        ? new Date(experticia.createdAt).toISOString().split("T")[0]
        : "",
    },
  });

  /**
   * Observa cambios en el campo "abonado" en tiempo real
   * Se usa para habilitar/deshabilitar la subida de archivos
   * (solo permite subir si hay un número de abonado ingresado)
   */
  const abonadoValue = form.watch("abonado");

  /**
   * Observa cambios en el campo "tipoExperticia" en tiempo real
   * Se usa para determinar qué tipo de análisis ejecutar
   */
  const tipoExperticiaValue = form.watch("tipoExperticia");

  /**
   * Maneja el envío del formulario
   * - Valida que no haya carga de archivo en progreso
   * - Extrae y procesa las filas BTS seleccionadas o contactos frecuentes
   * - Envía datos completos al callback onSubmit del padre
   */
  const handleSubmit = (data: FormData) => {
    if (fileUploadState.isUploading) return; // Previene envío durante carga

    let filasSeleccionadas: any[] = [];
    let datosAnalisis: any = null;
    let datosSeleccionadosTop10: any = null;

    // Si es análisis de contactos frecuentes, usa los datos crudos seleccionados
    if (
      tipoExperticiaValue === "determinar_contacto_frecuente" &&
      contactosFrecuentesState.datosCrudos
    ) {
      // Guardar todos los datos crudos (datosAnalisis)
      // La estructura ahora incluye: ABONADO A, ABONADO B, TIPO TRANSACCION, FECHA, HORA, TIME, BTS-CELDA, DIRECCION_A, DIRECCION_B, CORDENADAS_A, CORDENADAS_B, ORIENTACION A, ORIENTACION B, IMEI ABONADO A, IMEI ABONADO B
      datosAnalisis = contactosFrecuentesState.datosCrudos;

      // Extraer solo los seleccionados del TOP 10
      filasSeleccionadas = extractSelectedRows(
        contactosFrecuentesState.datosCrudos,
        selectedRows
      );
      datosSeleccionadosTop10 = filasSeleccionadas;
    } else if (btsAnalysisState.results) {
      // Extrae las filas seleccionadas desde el análisis BTS
      filasSeleccionadas = extractSelectedRows(
        btsAnalysisState.results,
        selectedRows
      );
    }

    const submitData = {
      ...data,
      filasSeleccionadas,
      datosAnalisis,
      datosSeleccionadosTop10,
      listaAnalisis: listaAnalisis.map((item) => ({
        numero: item.numero,
        archivoNombre: item.archivoNombre,
        resultados: item.resultados,
      })),
    } as any;

    // Agregar TOP 10 contactos si es análisis de contactos frecuentes (para compatibilidad)
    if (tipoExperticiaValue === "determinar_contacto_frecuente") {
      submitData.top10Contactos = contactosFrecuentesState.top10Contactos;
    }

    onSubmit(submitData);
  };

  /**
   * Maneja scroll suave del formulario con teclas de flecha
   * - ArrowUp: scroll hacia arriba
   * - ArrowDown: scroll hacia abajo
   * Permite navegar el formulario largo de forma fluida
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const scrollAmount = 80; // Píxeles a desplazar por cada pulsación

    if (e.key === "ArrowUp") {
      e.preventDefault();
      scrollContainer.scrollTo({
        top: Math.max(0, scrollContainer.scrollTop - scrollAmount),
        behavior: "smooth",
      });
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      scrollContainer.scrollTo({
        top: Math.min(
          scrollContainer.scrollHeight - scrollContainer.clientHeight,
          scrollContainer.scrollTop + scrollAmount
        ),
        behavior: "smooth",
      });
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center space-x-2">
          <Atom className="h-5 w-5" />
          <span>
            {isEditing
              ? "Editar Experticia"
              : isDuplicating
              ? "Duplicar Experticia"
              : "Nueva Experticia"}
          </span>
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
            scrollbarWidth: "thin",
            scrollbarColor: "#d1d5db transparent",
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
                          value={field.value?.toString() || ""}
                          onKeyDown={(e) =>
                            handleDateInputKeyDown(e, CHAR_PATTERNS.dateTime)
                          }
                        />
                      ) : (
                        <div className="flex items-center p-3 border rounded-md bg-gray-50">
                          <span className="text-sm text-gray-600">
                            {field.value?.toString() || "No establecida"} (Solo
                            administradores pueden editar fechas)
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
                    <FormLabel>Reg Desde/Hasta</FormLabel>
                    <FormControl>
                      {permissions.canEditCreationDates ? (
                        <Input
                          placeholder="desde: 20-11-2024 hasta: 19-11-2025"
                          {...field}
                          value={field.value?.toString() || ""}
                        />
                      ) : (
                        <div className="flex items-center p-3 border rounded-md bg-gray-50">
                          <span className="text-sm text-gray-600">
                            {field.value?.toString() || "No establecida"} (Solo
                            administradores pueden editar fechas)
                          </span>
                        </div>
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
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
                          const allowedKeys = [
                            "Backspace",
                            "Delete",
                            "Tab",
                            "Enter",
                            "ArrowLeft",
                            "ArrowRight",
                            "ArrowUp",
                            "ArrowDown",
                            "Home",
                            "End",
                          ];
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
                        onKeyDown={(e) =>
                          handleDateInputKeyDown(e, CHAR_PATTERNS.time)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="createdAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Fecha de Creación de la Experticia (Solo Experticias
                    Atrasadas o no Procesadas)
                  </FormLabel>
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
                          {field.value
                            ? new Date(field.value).toLocaleDateString("es-ES")
                            : "Fecha automática"}{" "}
                          (Solo administradores pueden editar)
                        </span>
                      </div>
                    )}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar operador" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {OPERATORS.map((op) => (
                          <SelectItem key={op.id} value={op.id}>
                            {op.label}
                          </SelectItem>
                        ))}
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
                        {EXPERTICIA_TYPES.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.label}
                          </SelectItem>
                        ))}
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
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value ?? undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar estado" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {STATUSES.map((st) => (
                          <SelectItem key={st.id} value={st.id}>
                            {st.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                  <FormLabel>Dirección*</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Dirección del lugar de interés criminalístico..."
                      {...field}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Información del abonado 
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
          </div>*/}

          {/* SECCIÓN: Análisis y Detalles Técnicos BTS
              Contiene: campo abonado, subida de archivo Excel, análisis BTS, conclusiones */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Análisis, Detalles Técnicos</h3>

            {/* Campo Abonado: número de teléfono a analizar (solo números) */}
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
                        // Permitir combinaciones de Ctrl (o Meta en Mac) para copiar, pegar, deshacer, etc.
                        if (e.ctrlKey || e.metaKey) {
                          const allowedCtrlKeys = [
                            "v",
                            "c",
                            "x",
                            "a",
                            "z",
                            "y",
                            "V",
                            "C",
                            "X",
                            "A",
                            "Z",
                            "Y",
                          ];
                          if (allowedCtrlKeys.includes(e.key)) {
                            return; // Permitir la acción
                          }
                        }
                        handleDateInputKeyDown(e, CHAR_PATTERNS.numeric);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Campo: Subida de archivo Excel
                - Solo se habilita si hay un número de abonado ingresado
                - Tras subir el archivo:
                  1. Se envía al servidor para almacenamiento
                  2. Se dispara automáticamente análisis BTS
                  3. Se muestran resultados en tabla seleccionable
            */}
            <div className="space-y-3 border rounded-lg p-3 bg-gray-50 dark:bg-gray-900/20">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Tabla de Experticia
                </h4>
                <div className="flex items-center space-x-2">
                  <Input
                    type="file"
                    className="hidden"
                    id="multi-file-upload"
                    accept=".xls,.xlsx"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file && abonadoValue) {
                        agregarAnalisis(
                          abonadoValue,
                          file,
                          form.getValues("operador") || ""
                        );
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() =>
                      document.getElementById("multi-file-upload")?.click()
                    }
                    disabled={!abonadoValue || listaAnalisis.length >= 10}
                  >
                    <Upload className="h-3.5 w-3.5 mr-1.5" />
                    {listaAnalisis.length >= 10
                      ? "Límite Alcanzado"
                      : "Agregar"}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={procesarTodosLosAnalisis}
                    disabled={
                      listaAnalisis.length === 0 || btsAnalysisState.isAnalyzing
                    }
                  >
                    {btsAnalysisState.isAnalyzing ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    ) : (
                      <Atom className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    Analizar Todo
                  </Button>
                </div>
              </div>

              {listaAnalisis.length > 0 && (
                <div className="border rounded-md overflow-hidden bg-white dark:bg-black shadow-sm">
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow className="hover:bg-transparent border-b h-8">
                        <TableHead className="h-8 py-1 text-[11px] font-bold uppercase tracking-tight px-3">
                          Número
                        </TableHead>
                        <TableHead className="h-8 py-1 text-[11px] font-bold uppercase tracking-tight px-3">
                          Archivo
                        </TableHead>
                        <TableHead className="h-8 py-1 text-[11px] font-bold uppercase tracking-tight w-[100px] px-3">
                          Estado
                        </TableHead>
                        <TableHead className="h-8 py-1 text-[11px] font-bold uppercase tracking-tight w-[50px] text-center px-3">
                          Acción
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {listaAnalisis.map((item, index) => (
                        <TableRow
                          key={item.id}
                          className={`cursor-pointer transition-colors h-8 border-b last:border-0 ${
                            selectedIndex === index
                              ? "bg-blue-50/80 dark:bg-blue-900/20"
                              : "hover:bg-muted/30"
                          }`}
                          onClick={() => setSelectedIndex(index)}
                        >
                          <TableCell className="py-1 px-3 font-mono text-[11px] font-medium">
                            {item.numero}
                          </TableCell>
                          <TableCell
                            className="py-1 px-3 max-w-[180px] truncate text-[11px] text-muted-foreground"
                            title={item.archivoNombre}
                          >
                            {item.archivoNombre}
                          </TableCell>
                          <TableCell className="py-1 px-3">
                            {item.resultados ? (
                              <Badge
                                variant="outline"
                                className="h-5 px-1.5 py-0 text-[9px] font-bold bg-green-50 text-green-700 border-green-200/50 rounded-full"
                              >
                                <CheckCircle className="h-2.5 w-2.5 mr-1" />{" "}
                                LISTO
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="h-5 px-1.5 py-0 text-[9px] font-bold bg-amber-50 text-amber-700 border-amber-200/50 rounded-full"
                              >
                                PENDIENTE
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="py-1 px-3 text-center">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                setListaAnalisis((prev) =>
                                  prev.filter((_, i) => i !== index)
                                );
                                if (selectedIndex === index)
                                  setSelectedIndex(null);
                              }}
                            >
                              <XCircle className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

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
                        disabled={
                          !abonadoValue ||
                          fileUploadState.isUploading ||
                          listaAnalisis.length > 0
                        }
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            // Paso 1: Inicia carga de archivo
                            setFileUploadState({
                              isUploading: true,
                              uploadedFile: null,
                              error: null,
                            });

                            try {
                              const formData = new FormData();
                              formData.append("archivo", file);

                              // POST a servidor: sube archivo Excel
                              const response = await fetch(
                                "/api/experticias/upload-archivo",
                                {
                                  method: "POST",
                                  headers: {
                                    Authorization: `Bearer ${localStorage.getItem(
                                      "token"
                                    )}`,
                                  },
                                  body: formData,
                                }
                              );

                              if (response.ok) {
                                const result = await response.json();
                                // Guarda ruta del archivo en el campo
                                field.onChange(result.archivo.rutaArchivo);
                                // Guarda metadata del archivo (nombre, tamaño)
                                form.setValue(
                                  "nombreArchivo",
                                  result.archivo.nombreArchivo
                                );
                                form.setValue(
                                  "tamañoArchivo",
                                  result.archivo.tamañoArchivo
                                );

                                // Actualiza UI con archivo subido exitosamente
                                setFileUploadState({
                                  isUploading: false,
                                  uploadedFile: {
                                    name: result.archivo.nombreArchivo,
                                    size: formatFileSize(
                                      result.archivo.tamañoArchivo
                                    ),
                                  },
                                  error: null,
                                });

                                // Paso 2: Si hay abonado, inicia análisis automático
                                if (abonadoValue) {
                                  // UNIFICACIÓN: Agregar a la tabla de experticia automáticamente
                                  agregarAnalisis(
                                    abonadoValue,
                                    file,
                                    form.getValues("operador") || ""
                                  );

                                  // Ya no necesitamos disparar el análisis aquí porque se gestionará desde la tabla
                                  // o el usuario podrá darle a "Analizar Todo"
                                }
                              } else {
                                const errorText = await response.text();
                                field.onChange("");
                                setFileUploadState({
                                  isUploading: false,
                                  uploadedFile: null,
                                  error: errorText || "Error subiendo archivo",
                                });
                              }
                            } catch (error) {
                              field.onChange("");
                              setFileUploadState({
                                isUploading: false,
                                uploadedFile: null,
                                error: "Error de conexión al subir archivo",
                              });
                            }
                          }
                        }}
                        className={`file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium ${
                          fileUploadState.uploadedFile
                            ? "border-green-500"
                            : fileUploadState.error
                            ? "border-red-500"
                            : ""
                        }`}
                      />

                      {/* Indicador: Carga en progreso */}
                      {fileUploadState.isUploading && (
                        <div className="flex items-center space-x-2 text-sm text-blue-600">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Subiendo archivo...</span>
                        </div>
                      )}

                      {/* Indicador: Carga exitosa con metadata del archivo */}
                      {fileUploadState.uploadedFile && (
                        <div className="flex items-center space-x-2 text-sm text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          <FileSpreadsheet className="h-4 w-4" />
                          <span>{fileUploadState.uploadedFile.name}</span>
                          <span className="text-gray-500">
                            ({fileUploadState.uploadedFile.size})
                          </span>
                        </div>
                      )}

                      {/* Indicador: Error en carga o análisis */}
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
                  {listaAnalisis.length > 0 && (
                    <p className="text-xs text-amber-600 mt-1 font-medium">
                      Carga individual deshabilitada porque hay elementos en la
                      Lista Multi-Target.
                    </p>
                  )}
                </FormItem>
              )}
            />

            {/* SECCIÓN: Resultados del análisis BTS
                Muestra tabla de resultados con selección de filas
                Solo se renderiza si hay análisis en progreso, resultados o error */}
            {(btsAnalysisState.isAnalyzing ||
              btsAnalysisState.results ||
              btsAnalysisState.error) && (
              <div className="space-y-3 border-t pt-4">
                <h4 className="text-md font-medium">Análisis BTS</h4>

                {/* Estado: Procesando análisis */}
                {btsAnalysisState.isAnalyzing && (
                  <div className="flex items-center space-x-2 text-sm text-blue-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Analizando archivo BTS...</span>
                  </div>
                )}

                {/* Estado: Error en análisis */}
                {btsAnalysisState.error && (
                  <div className="flex items-center space-x-2 text-sm text-red-600">
                    <XCircle className="h-4 w-4" />
                    <span>{btsAnalysisState.error}</span>
                  </div>
                )}

                {/* Estado: Resultados encontrados
                    - Muestra contador de resultados
                    - Tabla preview con scroll horizontal
                    - Botón para expandir tabla en modal */}
                {btsAnalysisState.results &&
                  btsAnalysisState.results.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-green-600 font-medium">
                          Resultados encontrados:{" "}
                          {btsAnalysisState.results.length}
                        </div>
                        {/* Botón: Abre modal con tabla completa y selección */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsTableModalOpen(true)}
                          title="Ver tabla completa"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                      {/* Tabla preview (primeras 6 filas) */}
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
                              <TableRow
                                key={index}
                                className={
                                  selectedRows.has(index)
                                    ? "bg-blue-100 dark:bg-blue-900/40"
                                    : ""
                                }
                              >
                                <TableCell className="py-1 px-2 text-xs">
                                  {result["ABONADO A"] ||
                                    result["ABONADO_A"] ||
                                    "-"}
                                </TableCell>
                                <TableCell className="py-1 px-2 text-xs">
                                  {result["ABONADO B"] ||
                                    result["ABONADO_B"] ||
                                    "-"}
                                </TableCell>
                                <TableCell className="py-1 px-2 text-xs">
                                  {" "}
                                  {/* py-1 alto px ancho text-xs ajustar texto */}
                                  {result["FECHA"] || "-"}
                                </TableCell>
                                <TableCell className="py-1 px-2 text-xs">
                                  {result["HORA"] || "-"}
                                </TableCell>
                                <TableCell className="py-1 px-2 text-xs">
                                  {result["TIME"] || "-"}
                                </TableCell>
                                <TableCell className="py-1 px-2 text-xs">
                                  {result["DIRECCION"] || "-"}
                                </TableCell>
                                <TableCell className="py-1 px-2 text-xs">
                                  {result["CORDENADAS"] || "-"}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}

                {/* Sin resultados */}
                {btsAnalysisState.results &&
                  btsAnalysisState.results.length === 0 && (
                    <div className="text-sm text-gray-600">
                      No se encontraron resultados para el número {abonadoValue}
                    </div>
                  )}
              </div>
            )}

            {/* SECCIÓN: Resultados del análisis de Contactos Frecuentes
                Muestra DOS tablas:
                1. Datos crudos del Excel (primeras 6 columnas) con selección de filas
                2. TOP 10 contactos más frecuentes con estadísticas */}
            {(contactosFrecuentesState.isAnalyzing ||
              contactosFrecuentesState.datosCrudos ||
              contactosFrecuentesState.top10Contactos ||
              contactosFrecuentesState.error) && (
              <div className="space-y-4 border-t pt-4">
                <h4 className="text-md font-medium">
                  Análisis de Contactos Frecuentes
                </h4>

                {/* Estado: Procesando análisis */}
                {contactosFrecuentesState.isAnalyzing && (
                  <div className="flex items-center space-x-2 text-sm text-blue-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Analizando contactos frecuentes...</span>
                  </div>
                )}

                {/* Estado: Error en análisis */}
                {contactosFrecuentesState.error && (
                  <div className="flex items-center space-x-2 text-sm text-red-600">
                    <XCircle className="h-4 w-4" />
                    <span>{contactosFrecuentesState.error}</span>
                  </div>
                )}

                {/* TABLA 1: Datos Crudos del Excel - RENDERIZADO DINÁMICO */}
                {contactosFrecuentesState.datosCrudos &&
                  contactosFrecuentesState.datosCrudos.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-green-600 font-medium">
                          Registros de comunicación:{" "}
                          {contactosFrecuentesState.datosCrudos.length}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsContactosTableModalOpen(true)}
                          title="Ver tabla completa"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="max-h-48 overflow-y-auto border rounded-lg">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              {contactosFrecuentesState.datosCrudos.length >
                                0 &&
                                Object.keys(
                                  contactosFrecuentesState.datosCrudos[0]
                                ).map((col) => (
                                  <TableHead key={col}>{col}</TableHead>
                                ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {contactosFrecuentesState.datosCrudos.map(
                              (row, index) => (
                                <TableRow key={index}>
                                  {Object.keys(row).map((col) => (
                                    <TableCell
                                      key={col}
                                      className="py-1 px-2 text-xs"
                                    >
                                      {row[col] || "-"}
                                    </TableCell>
                                  ))}
                                </TableRow>
                              )
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}

                {/* TABLA 2: TOP 10 Contactos Frecuentes */}
                {contactosFrecuentesState.top10Contactos &&
                  contactosFrecuentesState.top10Contactos.length > 0 && (
                    <div className="space-y-2 mt-4">
                      <h5 className="text-sm font-medium text-blue-700">
                        TOP 10 Contactos Más Frecuentes
                      </h5>
                      <div className="max-h-64 overflow-y-auto border rounded-lg border-blue-200">
                        <Table>
                          <TableHeader className="bg-blue-50">
                            <TableRow>
                              <TableHead>#</TableHead>
                              <TableHead>Número</TableHead>
                              <TableHead>Frecuencia</TableHead>
                              <TableHead>Primera Fecha</TableHead>
                              <TableHead>Última Fecha</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {contactosFrecuentesState.top10Contactos.map(
                              (contacto, index) => (
                                <TableRow key={index}>
                                  <TableCell className="py-1 px-2 text-xs font-bold">
                                    {index + 1}
                                  </TableCell>
                                  <TableCell className="py-1 px-2 text-xs font-mono">
                                    {contacto.numero || contacto.NUMERO || "-"}
                                  </TableCell>
                                  <TableCell className="py-1 px-2 text-xs text-center">
                                    <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                                      {contacto.frecuencia ||
                                        contacto.FRECUENCIA ||
                                        0}
                                    </span>
                                  </TableCell>
                                  <TableCell className="py-1 px-2 text-xs">
                                    {contacto.primera_fecha ||
                                      contacto.PRIMERA_FECHA ||
                                      "-"}
                                  </TableCell>
                                  <TableCell className="py-1 px-2 text-xs">
                                    {contacto.ultima_fecha ||
                                      contacto.ULTIMA_FECHA ||
                                      "-"}
                                  </TableCell>
                                </TableRow>
                              )
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}

                {/* Sin resultados */}
                {contactosFrecuentesState.datosCrudos &&
                  contactosFrecuentesState.datosCrudos.length === 0 && (
                    <div className="text-sm text-gray-600">
                      No se encontraron registros de comunicación para el número{" "}
                      {abonadoValue}
                    </div>
                  )}
              </div>
            )}

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
              {isLoading
                ? "Guardando..."
                : isEditing
                ? "Actualizar"
                : isDuplicating
                ? "Duplicar"
                : "Crear"}
            </Button>
          </div>
        </form>
      </Form>

      <Dialog open={isTableModalOpen} onOpenChange={setIsTableModalOpen}>
        <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Resultados del Análisis BTS</DialogTitle>
          </DialogHeader>
          <div className="overflow-auto max-h-[75vh]">
            {btsAnalysisState.results &&
              btsAnalysisState.results.length > 0 && (
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
                      <TableRow
                        key={index}
                        onClick={() => toggleRowSelection(index)}
                        className={`cursor-pointer transition-colors py-1 text-sm ${
                          selectedRows.has(index)
                            ? "bg-blue-100 dark:bg-blue-900/40 hover:bg-blue-200 dark:hover:bg-blue-800/50"
                            : "hover:bg-muted/50"
                        }`}
                        data-testid={`row-bts-result-${index}`}
                      >
                        <TableCell className="py-1 px-2 text-xs">
                          {result["ABONADO A"] || result["ABONADO_A"] || "-"}
                        </TableCell>
                        <TableCell className="py-1 px-2 text-xs">
                          {result["ABONADO B"] || result["ABONADO_B"] || "-"}
                        </TableCell>
                        <TableCell className="py-1 px-2 text-xs">
                          {result["FECHA"] || "-"}
                        </TableCell>
                        <TableCell className="py-1 px-2 text-xs">
                          {result["HORA"] || "-"}
                        </TableCell>
                        <TableCell className="py-1 px-2 text-xs">
                          {result["TIME"] || "-"}
                        </TableCell>
                        <TableCell className="py-1 px-2 text-xs">
                          {result["DIRECCION"] || "-"}
                        </TableCell>
                        <TableCell className="py-1 px-2 text-xs">
                          {result["CORDENADAS"] || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isContactosTableModalOpen}
        onOpenChange={setIsContactosTableModalOpen}
      >
        <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>
              Registros de Comunicación - Vista Completa
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-auto max-h-[75vh]">
            {contactosFrecuentesState.datosCrudos &&
              contactosFrecuentesState.datosCrudos.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      {contactosFrecuentesState.datosCrudos.length > 0 &&
                        Object.keys(
                          contactosFrecuentesState.datosCrudos[0]
                        ).map((col) => <TableHead key={col}>{col}</TableHead>)}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contactosFrecuentesState.datosCrudos.map((row, index) => (
                      <TableRow key={index}>
                        {Object.keys(row).map((col) => (
                          <TableCell key={col} className="py-1 px-2 text-xs">
                            {row[col] || "-"}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
