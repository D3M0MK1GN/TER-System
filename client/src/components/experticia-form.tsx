import { useForm } from "react-hook-form";
import { useRef } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Atom, Upload } from "lucide-react";
import { insertExperticiasSchema, type Experticia } from "@shared/schema";
import { type z } from "zod";

type FormData = z.infer<typeof insertExperticiasSchema>;

interface ExperticiasFormProps {
  experticia?: Experticia | null;
  onSubmit: (data: FormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ExperticiasForm({ experticia, onSubmit, onCancel, isLoading }: ExperticiasFormProps) {
  const isEditing = !!experticia;
  const scrollContainerRef = useRef<HTMLFormElement>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(insertExperticiasSchema),
    defaultValues: {
      numeroDictamen: experticia?.numeroDictamen || "",
      experto: experticia?.experto || "",
      numeroComunicacion: experticia?.numeroComunicacion || "",
      fechaComunicacion: experticia?.fechaComunicacion?.toString() || "",
      motivo: experticia?.motivo || "",
      operador: experticia?.operador || undefined,
      fechaRespuesta: experticia?.fechaRespuesta?.toString() || "",
      usoHorario: experticia?.usoHorario ?? "",
      archivoAdjunto: experticia?.archivoAdjunto ?? "",
      tipoExperticia: experticia?.tipoExperticia || "",
      abonado: experticia?.abonado ?? "",
      datosAbonado: experticia?.datosAbonado ?? "",
      conclusion: experticia?.conclusion ?? "",
      expediente: experticia?.expediente || "",
      estado: experticia?.estado || "procesando",
      usuarioId: experticia?.usuarioId || undefined,
    },
  });

  const handleSubmit = (data: FormData) => {
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
                      <Input 
                        placeholder="Fecha de comunicación" 
                        {...field}
                        value={field.value?.toString() || ''}
                      />
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
                      <Input 
                        placeholder="Fecha de respuesta" 
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
                    <FormControl>
                      <Input 
                        placeholder="Tipo de análisis a realizar" 
                        {...field} 
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
              name="abonado"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Abonado</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Número o identificación del abonado" 
                      {...field}
                      value={field.value || ""} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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

          {/* Archivo y conclusión */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Documentación y Resultados</h3>
            
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
                    <Input 
                      type="file"
                      accept=".xls,.xlsx"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          field.onChange(file.name);
                        }
                      }}
                      className="file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium"
                    />
                  </FormControl>
                  <p className="text-sm text-gray-600">
                    Formatos permitidos: XLS, XLSX
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

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