import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/use-permissions";
import { ExperticiasTable } from "@/components/experticia-table";
import { ExperticiasForm } from "@/components/experticia-form";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { type Experticia, type InsertExperticia } from "@shared/schema";

export function ExperticiasManagement() {
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    categoria: "all",
    estado: "all", 
    search: "",
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingExperticia, setEditingExperticia] = useState<Experticia | null>(null);
  const pageSize = 10;

  const { user } = useAuth();
  const permissions = usePermissions();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch experticias
  const { data: experticiasData, isLoading } = useQuery({
    queryKey: ["/api/experticias", currentPage, pageSize, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: pageSize.toString(),
        ...Object.fromEntries(Object.entries(filters).filter(([_, value]) => value)),
      });
      return await fetch(`/api/experticias?${params}`, {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
      }).then(res => res.json());
    },
  });

  const experticias = experticiasData?.experticias || [];
  const total = experticiasData?.total || 0;

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: InsertExperticia) => {
      return await apiRequest("/api/experticias", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/experticias"] });
      setShowCreateModal(false);
      toast({
        title: "Experticia creada",
        description: "La experticia ha sido creada exitosamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al crear la experticia.",
        variant: "destructive",
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: InsertExperticia }) => {
      return await apiRequest(`/api/experticias/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/experticias"] });
      setEditingExperticia(null);
      toast({
        title: "Experticia actualizada",
        description: "La experticia ha sido actualizada exitosamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al actualizar la experticia.",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/experticias/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/experticias"] });
      toast({
        title: "Experticia eliminada",
        description: "La experticia ha sido eliminada exitosamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al eliminar la experticia.",
        variant: "destructive",
      });
    },
  });

  const handleCreate = (data: InsertExperticia) => {
    createMutation.mutate({ ...data, usuarioId: user?.id });
  };

  const handleUpdate = (data: InsertExperticia) => {
    if (editingExperticia) {
      updateMutation.mutate({
        id: editingExperticia.id,
        data: { ...data, usuarioId: editingExperticia.usuarioId },
      });
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("¿Estás seguro de que deseas eliminar esta experticia?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (experticia: Experticia) => {
    setEditingExperticia(experticia);
  };

  const handleView = (experticia: Experticia) => {
    // La tabla ya maneja la visualización en el modal interno
  };

  return (
    <div className="p-6">
      <ExperticiasTable
        experticias={experticias}
        total={total}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onFiltersChange={setFilters}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        onCreateNew={() => setShowCreateModal(true)}
        loading={isLoading}
        permissions={permissions}
      />

      {/* Create Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl">
          <ExperticiasForm
            onSubmit={handleCreate}
            onCancel={() => setShowCreateModal(false)}
            isLoading={createMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={!!editingExperticia} onOpenChange={() => setEditingExperticia(null)}>
        <DialogContent className="max-w-2xl">
          <ExperticiasForm
            experticia={editingExperticia}
            onSubmit={handleUpdate}
            onCancel={() => setEditingExperticia(null)}
            isLoading={updateMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}