import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSolicitudSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, X } from "lucide-react";
import { z } from "zod";

const requestFormSchema = insertSolicitudSchema.extend({
  numeroSolicitud: z.string().min(1, "Número de solicitud es requerido"),
  numeroExpediente: z.string().min(1, "Número de expediente es requerido"),
  tipoExperticia: z.string().min(1, "Tipo de experticia es requerido"),
  coordinacionSolicitante: z.string().min(1, "Coordinación solicitante es requerida"),
  operador: z.string().min(1, "Operador es requerido"),
});

type RequestFormData = z.infer<typeof requestFormSchema>;

interface RequestFormProps {
  onSubmit: (data: RequestFormData) => void;
  onCancel: () => void;
  initialData?: Partial<RequestFormData>;
  isLoading?: boolean;
}

export function RequestForm({ onSubmit, onCancel, initialData, isLoading }: RequestFormProps) {
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
      descripcion: "",
      estado: "pendiente",
      oficio: "",
      ...initialData,
    },
  });

  const handleSubmit = (data: RequestFormData) => {
    onSubmit(data);
  };

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
                placeholder="SOL-2024-XXX"
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
                placeholder="Carlos León"
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
                  <SelectItem value="movistar">Movistar</SelectItem>
                  <SelectItem value="claro">Claro</SelectItem>
                  <SelectItem value="entel">Entel</SelectItem>
                  <SelectItem value="bitel">Bitel</SelectItem>
                  <SelectItem value="otros">Otros</SelectItem>
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
                onValueChange={(value) => form.setValue("tipoExperticia", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione tipo de experticia" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="analisis_radioespectro">Análisis de Radioespectro</SelectItem>
                  <SelectItem value="identificacion_bts">Identificación BTS</SelectItem>
                  <SelectItem value="analisis_trafico">Análisis de Tráfico</SelectItem>
                  <SelectItem value="localizacion_antenas">Localización de Antenas</SelectItem>
                  <SelectItem value="analisis_cobertura">Análisis de Cobertura</SelectItem>
                  <SelectItem value="otros">Otros</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.tipoExperticia && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.tipoExperticia.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="coordinacionSolicitante">Coordinación Solicitante *</Label>
              <Select
                value={form.watch("coordinacionSolicitante")}
                onValueChange={(value) => form.setValue("coordinacionSolicitante", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione coordinación" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="delitos_propiedad">Delitos Contra la Propiedad</SelectItem>
                  <SelectItem value="delitos_personas">Delitos Contra las Personas</SelectItem>
                  <SelectItem value="crimen_organizado">Crimen Organizado</SelectItem>
                  <SelectItem value="ciberdelitos">Ciberdelitos</SelectItem>
                  <SelectItem value="otros">Otros</SelectItem>
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
              <Select
                value={form.watch("estado") || "pendiente"}
                onValueChange={(value) => form.setValue("estado", value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="enviada">Enviada</SelectItem>
                  <SelectItem value="respondida">Respondida</SelectItem>
                  <SelectItem value="rechazada">Rechazada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="informacionLinea">Información de la Línea</Label>
              <Input
                id="informacionLinea"
                placeholder="Número de teléfono, IMEI, etc."
                {...form.register("informacionLinea")}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              rows={4}
              placeholder="Descripción detallada de la solicitud..."
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
