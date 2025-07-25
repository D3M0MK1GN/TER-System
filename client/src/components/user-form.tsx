import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { User } from "@shared/schema";

const createUserFormSchema = (isEdit: boolean) => {
  return z.object({
    username: z.string()
      .min(3, "El nombre de usuario debe tener al menos 3 caracteres")
      .max(30, "El nombre de usuario es muy largo")
      .regex(/^[a-zA-Z0-9_]+$/, "Solo se permiten letras, números y guiones bajos")
      .transform(val => val.trim().toLowerCase()),
    nombre: z.string()
      .min(2, "El nombre debe tener al menos 2 caracteres")
      .max(100, "El nombre es muy largo")
      .transform(val => val.trim()),
    email: z.string()
      .email("Email inválido")
      .max(255, "Email muy largo")
      .optional()
      .or(z.literal(""))
      .transform(val => val ? val.trim().toLowerCase() : val),
    rol: z.string().min(1, "Debe seleccionar un rol"),
    coordinacion: z.string().optional().or(z.literal("")),
    status: z.string().min(1, "Debe seleccionar un estado"),
    direccionIp: z.string()
      .optional()
      .or(z.literal(""))
      .transform(val => val ? val.trim() : val),
    password: isEdit 
      ? z.string().optional().or(z.literal(""))
      : z.string()
          .min(6, "La contraseña debe tener al menos 6 caracteres")
          .max(100, "La contraseña es muy larga"),
    tiempoSuspension: z.string().optional(),
    motivoSuspension: z.string()
      .max(500, "El motivo de suspensión es muy largo")
      .optional(),
    fechaSuspension: z.string().optional(),
  }).refine((data) => {
    // Si el status es suspendido, requerir tiempo y motivo
    if (data.status === "suspendido") {
      return data.tiempoSuspension && data.motivoSuspension;
    }
    return true;
  }, {
    message: "El tiempo y motivo de suspensión son requeridos cuando el estado es suspendido",
    path: ["tiempoSuspension"],
  }).refine((data) => {
    // Si el rol es usuario, la coordinación es obligatoria
    if (data.rol === "usuario") {
      return data.coordinacion && data.coordinacion.trim() !== "";
    }
    return true;
  }, {
    message: "La coordinación es obligatoria para usuarios",
    path: ["coordinacion"],
  });
};

type UserFormData = z.infer<ReturnType<typeof createUserFormSchema>>;

interface UserFormProps {
  onSubmit: (data: UserFormData) => void;
  onCancel?: () => void;
  user?: User | null;
  initialData?: Partial<User>;
  isLoading?: boolean;
  isEdit?: boolean;
}

export function UserForm({ onSubmit, onCancel, user, initialData, isLoading, isEdit = false }: UserFormProps) {
  const userData = user || initialData;
  const userFormSchema = createUserFormSchema(isEdit);
  const form = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      username: userData?.username || "",
      nombre: userData?.nombre || "",
      email: userData?.email || "",
      rol: userData?.rol || "usuario",
      coordinacion: userData?.coordinacion || "",
      status: userData?.status || "activo",
      direccionIp: userData?.direccionIp || "",
      password: "",
      tiempoSuspension: userData?.tiempoSuspension ? new Date(userData.tiempoSuspension).toISOString().slice(0, 16) : "",
      motivoSuspension: userData?.motivoSuspension || "",
      fechaSuspension: userData?.fechaSuspension ? new Date(userData.fechaSuspension).toISOString().slice(0, 16) : "",
    },
  });

  const handleSubmit = (data: UserFormData) => {
    // Transform datetime-local string to Date object if provided and clean up empty values
    const transformedData: any = { ...data };
    
    // Only include tiempoSuspension if it has a value
    if (data.tiempoSuspension && data.tiempoSuspension !== '') {
      transformedData.tiempoSuspension = new Date(data.tiempoSuspension);
    } else {
      delete transformedData.tiempoSuspension;
    }
    
    // Only include fechaSuspension if it has a value
    if (data.fechaSuspension && data.fechaSuspension !== '') {
      transformedData.fechaSuspension = new Date(data.fechaSuspension);
    } else {
      delete transformedData.fechaSuspension;
    }

    // Si es edición y no se proporciona contraseña, no la incluir
    if (isEdit && !transformedData.password) {
      const { password, ...dataWithoutPassword } = transformedData;
      onSubmit(dataWithoutPassword);
    } else {
      onSubmit(transformedData);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre de Usuario</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Ingresa el nombre de usuario" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="nombre"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre Completo</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Ingresa el nombre completo" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email (Opcional)</FormLabel>
              <FormControl>
                <Input {...field} type="email" placeholder="correo@ejemplo.com" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="rol"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rol</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un rol" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="usuario">Usuario</SelectItem>
                  <SelectItem value="supervisor">Supervisor</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Campo de coordinación - obligatorio solo para usuarios */}
        {form.watch("rol") === "usuario" && (
          <FormField
            control={form.control}
            name="coordinacion"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Coordinación *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una coordinación" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="delitos_propiedad">Coordinacion de los Delitos Contra la Propiedad</SelectItem>
                    <SelectItem value="delitos_personas">Coordinacion de los Delitos Contra las Personas</SelectItem>
                    <SelectItem value="crimen_organizado">Coordinacion de los Delitos Contra la Delincuencia Organizada</SelectItem>
                    <SelectItem value="delitos_vehiculos">Coordinacion de los Delitos Contra el Hurto y Robo de Vehiculo Automotor</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Estado</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un estado" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="activo">Activo</SelectItem>
                  <SelectItem value="suspendido">Suspendido</SelectItem>
                  <SelectItem value="bloqueado">Bloqueado</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Campos adicionales para suspensión */}
        {form.watch("status") === "suspendido" && (
          <>
            <FormField
              control={form.control}
              name="tiempoSuspension"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tiempo de Suspensión (hasta)</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      type="datetime-local" 
                      placeholder="Selecciona fecha y hora"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="motivoSuspension"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motivo de Suspensión</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="Describe el motivo de la suspensión"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        <FormField
          control={form.control}
          name="direccionIp"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dirección IP (Opcional)</FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  placeholder="Se detectará automáticamente si se deja vacío" 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Contraseña {isEdit && "(Dejar vacío para mantener la actual)"}
              </FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  type="password" 
                  placeholder={isEdit ? "Nueva contraseña (opcional)" : "Contraseña"} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (isEdit ? "Actualizando..." : "Creando...") : (isEdit ? "Actualizar" : "Crear Usuario")}
          </Button>
        </div>
      </form>
    </Form>
  );
}