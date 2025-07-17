import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/use-permissions";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { RequestTable } from "@/components/request-table";
import { RequestForm } from "@/components/request-form";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { type Solicitud } from "@shared/schema";

export default function Requests() {
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    operador: "",
    estado: "",
    tipoExperticia: "",
    search: "",
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSolicitud, setEditingSolicitud] = useState<Solicitud | null>(null);
  const pageSize = 10;

  const { user } = useAuth();
  const permissions = usePermissions();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: solicitudesData, isLoading } = useQuery({
    queryKey: ["/api/solicitudes", currentPage, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        ...filters,
      });
      
      const response = await fetch(`/api/solicitudes?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Error obteniendo solicitudes');
      }
      
      return response.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/solicitudes", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/solicitudes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setShowCreateModal(false);
      toast({
        title: "Solicitud creada",
        description: "La solicitud ha sido creada exitosamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error creando la solicitud",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiRequest("PUT", `/api/solicitudes/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/solicitudes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setEditingSolicitud(null);
      toast({
        title: "Solicitud actualizada",
        description: "La solicitud ha sido actualizada exitosamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error actualizando la solicitud",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/solicitudes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/solicitudes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Solicitud eliminada",
        description: "La solicitud ha sido eliminada exitosamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error eliminando la solicitud",
        variant: "destructive",
      });
    },
  });

  const handleCreateSubmit = (data: any) => {
    createMutation.mutate(data);
  };

  const handleEditSubmit = (data: any) => {
    if (editingSolicitud) {
      updateMutation.mutate({ id: editingSolicitud.id, data });
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("¿Está seguro de que desea eliminar esta solicitud?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleView = (solicitud: Solicitud) => {
    // TODO: Implement view modal
    console.log("View solicitud:", solicitud);
  };

  const handleFiltersChange = (newFilters: any) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const solicitudes = solicitudesData?.solicitudes || [];
  const total = solicitudesData?.total || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="ml-64 min-h-screen">
        <Header
          title="Gestión de Solicitudes"
          subtitle="Crear, editar y administrar solicitudes"
        />
        
        <main className="p-6">
          <RequestTable
            solicitudes={solicitudes}
            total={total}
            currentPage={currentPage}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onFiltersChange={handleFiltersChange}
            onEdit={setEditingSolicitud}
            onDelete={handleDelete}
            onView={handleView}
            onCreateNew={() => setShowCreateModal(true)}
            loading={isLoading}
          />
        </main>
      </div>

      {/* Create Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <RequestForm
            onSubmit={handleCreateSubmit}
            onCancel={() => setShowCreateModal(false)}
            isLoading={createMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={!!editingSolicitud} onOpenChange={() => setEditingSolicitud(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {editingSolicitud && (
            <RequestForm
              onSubmit={handleEditSubmit}
              onCancel={() => setEditingSolicitud(null)}
              initialData={editingSolicitud}
              isLoading={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
