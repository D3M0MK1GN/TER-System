import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Edit, Trash2, Mail } from "lucide-react";
import { useForm } from "react-hook-form";
import { type PlantillaCorreo } from "@shared/schema";

interface TemplateFormData {
  nombre: string;
  operador: string;
  asunto: string;
  cuerpo: string;
}

export default function Templates() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PlantillaCorreo | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: templates, isLoading } = useQuery<PlantillaCorreo[]>({
    queryKey: ["/api/plantillas"],
  });

  const form = useForm<TemplateFormData>({
    defaultValues: {
      nombre: "",
      operador: "",
      asunto: "",
      cuerpo: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: TemplateFormData) => {
      const response = await apiRequest("/api/plantillas", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/plantillas"] });
      setShowCreateModal(false);
      form.reset();
      toast({
        title: "Plantilla creada",
        description: "La plantilla ha sido creada exitosamente",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Error creando la plantilla",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: TemplateFormData }) => {
      const response = await apiRequest(`/api/plantillas/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/plantillas"] });
      setEditingTemplate(null);
      form.reset();
      toast({
        title: "Plantilla actualizada",
        description: "La plantilla ha sido actualizada exitosamente",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Error actualizando la plantilla",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest(`/api/plantillas/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/plantillas"] });
      toast({
        title: "Plantilla eliminada",
        description: "La plantilla ha sido eliminada exitosamente",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Error eliminando la plantilla",
        variant: "destructive",
      });
    },
  });

  const handleCreateSubmit = (data: TemplateFormData) => {
    createMutation.mutate(data);
  };

  const handleEditSubmit = (data: TemplateFormData) => {
    if (editingTemplate) {
      updateMutation.mutate({ id: editingTemplate.id, data });
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("¿Está seguro de que desea eliminar esta plantilla?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (template: PlantillaCorreo) => {
    setEditingTemplate(template);
    form.reset({
      nombre: template.nombre,
      operador: template.operador,
      asunto: template.asunto,
      cuerpo: template.cuerpo,
    });
  };

  const operatorColors = {
    digitel: "bg-blue-100 text-blue-800",
    movistar: "bg-red-100 text-red-800",
    movilnet: "bg-green-100 text-green-800",
  };

  const formatOperator = (operador: string) => {
    const names = {
      digitel: "Digitel",
      movistar: "Movistar",
      movilnet: "Movilnet",
    };
    return names[operador as keyof typeof names] || operador;
  };

  return (
    <Layout title="Plantillas de Correo" subtitle="Gestionar plantillas de correo por operador">
      <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Plantillas de Correo</h2>
            <Button onClick={() => setShowCreateModal(true)} className="bg-primary text-white">
              <Plus className="mr-2 h-4 w-4" />
              Nueva Plantilla
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              <div className="col-span-full text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-gray-600">Cargando plantillas...</p>
              </div>
            ) : (templates || []).length === 0 ? (
              <div className="col-span-full text-center py-8">
                <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No hay plantillas creadas</p>
              </div>
            ) : (
              (templates || []).map((template) => (
                <Card key={template.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{template.nombre}</CardTitle>
                      <Badge className={operatorColors[template.operador] || "bg-gray-100 text-gray-800"}>
                        {formatOperator(template.operador)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Asunto:</p>
                        <p className="text-sm text-gray-600">{template.asunto}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Contenido:</p>
                        <p className="text-sm text-gray-600 line-clamp-3">
                          {template.cuerpo.length > 100 
                            ? `${template.cuerpo.substring(0, 100)}...` 
                            : template.cuerpo}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-end space-x-2 mt-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(template)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(template.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

      {/* Create/Edit Modal */}
      <Dialog open={showCreateModal || !!editingTemplate} onOpenChange={(open) => {
        if (!open) {
          setShowCreateModal(false);
          setEditingTemplate(null);
          form.reset();
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? "Editar Plantilla" : "Nueva Plantilla"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(editingTemplate ? handleEditSubmit : handleCreateSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="nombre">Nombre de la Plantilla</Label>
              <Input
                id="nombre"
                placeholder="Ej: Solicitud estándar Movistar"
                {...form.register("nombre", { required: true })}
              />
            </div>
            
            <div>
              <Label htmlFor="operador">Operador</Label>
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
            </div>

            <div>
              <Label htmlFor="asunto">Asunto del Correo</Label>
              <Input
                id="asunto"
                placeholder="Ej: Solicitud de información técnica"
                {...form.register("asunto", { required: true })}
              />
            </div>

            <div>
              <Label htmlFor="cuerpo">Contenido del Correo</Label>
              <Textarea
                id="cuerpo"
                rows={6}
                placeholder="Estimados señores,

Por medio de la presente solicitamos...

Variables disponibles:
- {numeroSolicitud}
- {numeroExpediente}
- {fiscal}
- {tipoExperticia}
- {operador}
- {descripcion}"
                {...form.register("cuerpo", { required: true })}
              />
            </div>

            <div className="flex items-center justify-end space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingTemplate(null);
                  form.reset();
                }}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingTemplate ? "Actualizar" : "Crear"} Plantilla
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}