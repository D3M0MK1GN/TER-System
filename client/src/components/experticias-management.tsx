import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/use-permissions";
import { useExperticias } from "@/hooks/use-experticias";
import { ExperticiasTable } from "@/components/experticia-table";
import { ExperticiasForm } from "@/components/experticia-form";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { type Experticia, type InsertExperticia } from "@shared/schema";

export function ExperticiasManagement() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingExperticia, setEditingExperticia] = useState<Experticia | null>(null);
  const pageSize = 10;

  const { user } = useAuth();
  const permissions = usePermissions();
  
  const {
    experticias,
    total,
    currentPage,
    filters,
    isLoading,
    setCurrentPage,
    setFilters,
    handleDelete,
    createMutation,
    updateMutation,
  } = useExperticias(1, pageSize);


  const handleCreate = (data: InsertExperticia) => {
    createMutation.mutate({ ...data, usuarioId: user?.id });
    setShowCreateModal(false);
  };

  const handleUpdate = (data: InsertExperticia) => {
    if (editingExperticia) {
      updateMutation.mutate({
        id: editingExperticia.id,
        data,
      });
      setEditingExperticia(null);
    }
  };

  const handleEdit = (experticia: Experticia) => {
    setEditingExperticia(experticia);
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
        onView={() => {}}
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