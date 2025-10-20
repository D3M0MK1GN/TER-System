// Formulario de Gestion de Solicitudes
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSolicitudSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, X, Download } from "lucide-react";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/use-permissions";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useMemo } from "react";

// Mapeo de delitos por coordinación
const delitosPorCoordinacion: Record<string, string[]> = {
  delitos_propiedad: [
    "Contra la Propiedad",
    "Contra la Propiedad (Robo)",
    "Contra la Propiedad (Hurto)",
    "Contra la Propiedad (Estafa)",
  ],
  delitos_personas: [
    "Contra las Personas",
    "Contra las Personas (Lesiones)",
    "Contra las Personas (Lesiones Reciprocas)",
    "Contra las Personas (Violencia)",
    "Contra las Personas (Abuso Sexual)",
    "Contra las Personas (Homicidio)",
    "Contra las Personas (Femicidio)",
  ],
  delitos_vehiculos: [
    "Comtenplando en la Ley Sobre el Hurto y Robo de Vehiculos Automotor",
    "Contra el Hurto y Robo de Vehiculo Automor (ROBO)",
    "Contra el Hurto y Robo de Vehiculo Automor (HURTO)",
  ],
  crimen_organizado: ["Contra la Salubridad Publica", "Instigacion al Odio"],
  homicidio: [
    "Contra las Personas (Homicidio)",
    "Contra las Personas (Femicidio)",
  ],
};

const requestFormSchema = insertSolicitudSchema
  .extend({
    numeroSolicitud: z.string().min(1, "Número de solicitud es requerido"),
    numeroExpediente: z.string().min(1, "Número de expediente es requerido"),
    tipoExperticia: z.string().min(1, "Tipo de experticia es requerido"),
    coordinacionSolicitante: z
      .string()
      .min(1, "Coordinación solicitante es requerida"),
    operador: z.string().min(1, "Operador es requerido"),
    fechaSolicitud: z.string().optional(),
  })
  .refine(
    (data) => {
      // If estado is "rechazada", motivoRechazo is required
      if (data.estado === "rechazada") {
        return data.motivoRechazo && data.motivoRechazo.trim().length > 0;
      }
      return true;
    },
    {
      message:
        "El motivo de rechazo es requerido cuando el estado es 'rechazada'",
      path: ["motivoRechazo"],
    }
  );

type RequestFormData = z.infer<typeof requestFormSchema>;

interface RequestFormProps {
  onSubmit: (data: RequestFormData) => void;
  onCancel: () => void;
  initialData?: Partial<RequestFormData & { fiscal: string | null }>;
  isLoading?: boolean;
}

export function RequestForm({
  onSubmit,
  onCancel,
  initialData,
  isLoading,
}: RequestFormProps) {
  const { user } = useAuth();
  const permissions = usePermissions();
  const { toast } = useToast();

  // Determine default status based on user role
  const getDefaultStatus = () => {
    if (user?.rol === "supervisor" || user?.rol === "usuario") {
      return "enviada"; // Force enviada for supervisor and usuario
    }
    return initialData?.estado || "procesando"; // Admin can choose
  };

  const form = useForm<RequestFormData>({
    resolver: zodResolver(requestFormSchema),
    defaultValues: {
      numeroSolicitud: "",
      numeroExpediente: "",
      fiscal: "",
      tipoExperticia: "",
      coordinacionSolicitante: "",
      operador: "",
      informacionLinea: "",
      fecha_de_solicitud: "",
      direc: "",
      delito: "",
      descripcion: "",
      motivoRechazo: "",
      estado: getDefaultStatus(),
      oficio: "",
      fechaSolicitud: initialData?.fechaSolicitud
        ? new Date(initialData.fechaSolicitud).toISOString().split("T")[0]
        : "",
      ...initialData,
    },
  });

  // Observar cambios en la coordinación para limpiar el campo de delito
  const coordinacionSeleccionada = form.watch("coordinacionSolicitante");

  useEffect(() => {
    // Limpiar el campo de delito cuando cambie la coordinación
    if (coordinacionSeleccionada && !initialData) {
      form.setValue("delito", "");
    }
  }, [coordinacionSeleccionada]);

  // Filtrar delitos según la coordinación seleccionada
  const delitosDisponibles = useMemo(() => {
    if (!coordinacionSeleccionada) {
      return [];
    }
    return delitosPorCoordinacion[coordinacionSeleccionada] || [];
  }, [coordinacionSeleccionada]);

  // Template download is handled after successful form submission

  const handleTemplateDownload = async (tipoExperticia: string) => {
    try {
      const response = await fetch(
        `/api/plantillas-word/by-expertise/${tipoExperticia}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download =
          response.headers
            .get("content-disposition")
            ?.split("filename=")[1]
            ?.replace(/"/g, "") || "plantilla.docx";
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast({
          title: "Plantilla descargada",
          description: "La plantilla Word se ha descargado automáticamente.",
        });
      } else if (response.status === 404) {
        // No template available for this expertise type, silently continue
      } else {
        // Silent error for download failures
      }
    } catch (error) {
      // Silent error for download failures
    }
  };

  // Extraer y enviar datos
  const handleSubmit = (data: RequestFormData) => {
    // Enviar los datos tal cual, sin parsear prefijos
    onSubmit(data);
  };

  const fecha = form.watch("fechaSolicitud");
  const fechaDate = fecha ? new Date(fecha) : undefined;
  // Ahora puedes usar fechaDate de forma segura

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">
          {initialData ? "Editar Solicitud" : "Nueva Solicitud"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="numeroSolicitud">Número de Solicitud *</Label>
              <Input
                id="numeroSolicitud"
                placeholder="0271-0982"
                {...form.register("numeroSolicitud")}
              />
              {form.formState.errors.numeroSolicitud && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.numeroSolicitud.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="numeroExpediente">Número de Expediente *</Label>
              <Input
                id="numeroExpediente"
                placeholder="K-25-0271-00079"
                {...form.register("numeroExpediente")}
              />
              {form.formState.errors.numeroExpediente && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.numeroExpediente.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="fiscal">Fiscal</Label>
              <Input
                id="fiscal"
                placeholder="Ej. Carlos León Fiscal Adscrito a la Fiscalía Quinta (º5)"
                {...form.register("fiscal")}
              />
            </div>

            <div>
              <Label htmlFor="operador">Operador *</Label>
              <Select
                value={form.watch("operador")}
                onValueChange={(value) => form.setValue("operador", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un operador" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="digitel">Digitel</SelectItem>
                  <SelectItem value="movistar">Movistar</SelectItem>
                  <SelectItem value="movilnet">Movilnet</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.operador && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.operador.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="tipoExperticia">Tipo de Experticia *</Label>
              <Select
                value={form.watch("tipoExperticia")}
                onValueChange={(value) =>
                  form.setValue("tipoExperticia", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione tipo de experticia" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="identificar_datos_numero">
                    Identificar datos de un número
                  </SelectItem>
                  <SelectItem value="Identificar_linea_mediante_cedula_de_identidad">
                    Identificar linea mediante cedula de identidad
                  </SelectItem>
                  <SelectItem value="determinar_historicos_trazas_bts">
                    Determinar Históricos de Trazas Telefónicas BTS
                  </SelectItem>
                  <SelectItem value="determinar_linea_conexion_ip">
                    Determinar línea telefónica con conexión IP
                  </SelectItem>
                  <SelectItem value="identificar_radio_bases_bts">
                    Identificar las Radio Bases (BTS)
                  </SelectItem>
                  <SelectItem value="identificar_numeros_duraciones_bts">
                    Identificar números con duraciones específicas en la Radio
                    Base (BTS)
                  </SelectItem>
                  <SelectItem value="determinar_contaminacion_linea">
                    Determinar contaminación de línea
                  </SelectItem>
                  <SelectItem value="determinar_sim_cards_numero">
                    Determinar SIM CARDS utilizados con un número telefónico
                  </SelectItem>
                  <SelectItem value="determinar_comportamiento_social">
                    Determinar comportamiento social
                  </SelectItem>
                  <SelectItem value="determinar_contacto_frecuente">
                    Determinar Contacto Frecuente
                  </SelectItem>
                  <SelectItem value="determinar_ubicacion_llamadas">
                    Determinar ubicación mediante registros de llamadas
                  </SelectItem>
                  <SelectItem value="determinar_ubicacion_trazas">
                    Determinar ubicación mediante registros de trazas
                    telefónicas (Recorrido)
                  </SelectItem>
                  <SelectItem value="determinar_contaminacion_equipo_imei">
                    Determinar contaminación de equipo (IMEI)
                  </SelectItem>
                  <SelectItem value="identificar_numeros_comun_bts">
                    Identificar números en común en dos o más Radio Base (BTS)
                  </SelectItem>
                  <SelectItem value="identificar_numeros_desconectan_bts">
                    Identificar números que se desconectan de la Radio Base
                    (BTS) después del hecho
                  </SelectItem>
                  <SelectItem value="identificar_numeros_repetidos_bts">
                    Identificar números repetidos en la Radio Base (BTS)
                  </SelectItem>
                  <SelectItem value="determinar_numero_internacional">
                    Determinar número internacional
                  </SelectItem>
                  <SelectItem value="identificar_linea_sim_card">
                    Identificar línea mediante SIM CARD
                  </SelectItem>
                  <SelectItem value="identificar_cambio_simcard_documentos">
                    Identificar Cambio de SIM CARD y Documentos
                  </SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.tipoExperticia && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.tipoExperticia.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="coordinacionSolicitante">
                Coordinación Solicitante *
              </Label>
              <Select
                value={form.watch("coordinacionSolicitante")}
                onValueChange={(value) =>
                  form.setValue("coordinacionSolicitante", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione coordinación" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="delitos_propiedad">
                    Coordinacion de los Delitos Contra la Propiedad
                  </SelectItem>
                  <SelectItem value="delitos_personas">
                    Coordinacion de los Delitos Contra las Personas
                  </SelectItem>
                  <SelectItem value="crimen_organizado">
                    Coordinacion de los Delitos Contra la Delincuencia
                    Organizada
                  </SelectItem>
                  <SelectItem value="delitos_vehiculos">
                    Coordinacion de los Delitos Contra el Hurto y Robo de
                    Vehiculo Automotor
                  </SelectItem>
                  <SelectItem value="homicidio">Homicidio</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.coordinacionSolicitante && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.coordinacionSolicitante.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="estado">Estado</Label>
              {user?.rol === "admin" ? (
                <Select
                  value={form.watch("estado") || "procesando"}
                  onValueChange={(value) =>
                    form.setValue("estado", value as any)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="procesando">Procesando</SelectItem>
                    <SelectItem value="enviada">Enviada</SelectItem>
                    <SelectItem value="respondida">Respondida</SelectItem>
                    <SelectItem value="rechazada">Rechazada</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex items-center p-3 border rounded-md bg-gray-50">
                  <span className="text-sm text-gray-600">
                    Enviada (Solo administradores pueden cambiar el estado)
                  </span>
                </div>
              )}
            </div>

            {/* Conditional field for rejection reason */}
            {form.watch("estado") === "rechazada" && (
              <div className="col-span-2">
                <Label htmlFor="motivoRechazo">Motivo de Rechazo *</Label>
                <Textarea
                  id="motivoRechazo"
                  rows={3}
                  placeholder="Ingrese el motivo del rechazo..."
                  {...form.register("motivoRechazo")}
                />
                {form.formState.errors.motivoRechazo && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.motivoRechazo.message}
                  </p>
                )}
              </div>
            )}

            {/* Campo de fecha de creación solo editable por administradores */}
            <div>
              <Label htmlFor="fechaSolicitud">
                Fecha de Creación de la Solicitud
              </Label>
              {permissions.canEditCreationDates ? (
                <Input
                  id="fechaSolicitud"
                  type="date"
                  placeholder="Seleccione fecha de creación"
                  {...form.register("fechaSolicitud")}
                />
              ) : (
                <div className="flex items-center p-3 border rounded-md bg-gray-50">
                  <span className="text-sm text-gray-600">
                    {form.watch("fechaSolicitud")
                      ? new Date(
                          form.watch("fechaSolicitud")
                        ).toLocaleDateString("es-ES")
                      : "Fecha automática"}{" "}
                    (Solo administradores pueden editar)
                  </span>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="delito">Tipo de Delito *</Label>
              <Select
                value={form.watch("delito")}
                onValueChange={(value) => form.setValue("delito", value)}
                disabled={!coordinacionSeleccionada}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      coordinacionSeleccionada
                        ? "Seleccione el Delito"
                        : "Primero seleccione una coordinación"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {delitosDisponibles.map((delito) => (
                    <SelectItem key={delito} value={delito}>
                      {delito}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.delito && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.delito.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="informacionLinea">Información Solicitada</Label>
              <Input
                id="informacionLinea"
                placeholder="Numeros, IMEI, etc. Ejm. e: 04121556598 r: 04121556599"
                {...form.register("informacionLinea")}
              />
            </div>

            {/* Hide for Identificar datos de un numero */}
            {form.watch("tipoExperticia") !== "identificar_datos_numero" && (
              <div>
                <Label htmlFor="fecha_de_solicitud">Fecha de Solicitud</Label>
                <Input
                  id="fecha_de_solicitud"
                  placeholder="desde: 26-06-2001 hasta: 02-08-2001"
                  {...form.register("fecha_de_solicitud")}
                />
              </div>
            )}
          </div>

          {/* Hide for Identificar datos de un numero AND Determinar Contacto Frecuente */}
          {form.watch("tipoExperticia") !== "identificar_datos_numero" &&
            form.watch("tipoExperticia") !==
              "determinar_contacto_frecuente" && (
              <div>
                <Label htmlFor="direc">Direccion Solicitada</Label>
                <Textarea
                  id="direc"
                  placeholder="Direcion Exacta el Hecho."
                  {...form.register("direc")}
                />
              </div>
            )}

          <div>
            <Label htmlFor="descripcion">Reseña</Label>
            <Textarea
              id="descripcion"
              rows={4}
              placeholder="Reseña detallada de la solicitud..."
              {...form.register("descripcion")}
            />
          </div>

          <div>
            <Label htmlFor="oficio">Oficio (Enlace a archivo)</Label>
            <Input
              id="oficio"
              type="url"
              placeholder="https://example.com/document.pdf"
              {...form.register("oficio")}
            />
            <p className="text-sm text-gray-500 mt-1">
              Ingrese el enlace al archivo adjunto del oficio
            </p>
          </div>

          <div className="flex items-center justify-end space-x-4 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onCancel}>
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              <Save className="mr-2 h-4 w-4" />
              {isLoading ? "Guardando..." : "Guardar Solicitud"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
