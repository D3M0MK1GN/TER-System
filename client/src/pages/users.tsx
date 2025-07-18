import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UserTable } from "@/components/user-table";
import { UserForm } from "@/components/user-form";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { User } from "@shared/schema";
import { Plus } from "lucide-react";

interface UserFormData {
  username: string;
  nombre: string;
  email?: string;
  rol: string;
  status: string;
  direccionIp?: string;
  password?: string;
  tiempoSuspension?: string;
  motivoSuspension?: string;
  fechaSuspension?: string;
}

export default function Users() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['/api/users', currentPage, pageSize],
    queryFn: () => apiRequest(`/api/users?page=${currentPage}&limit=${pageSize}`),
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      return apiRequest('/api/users', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Usuario creado",
        description: "El usuario ha sido creado exitosamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el usuario.",
        variant: "destructive",
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UserFormData }) => {
      return apiRequest(`/api/users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setIsEditDialogOpen(false);
      setEditingUser(null);
      toast({
        title: "Usuario actualizado",
        description: "El usuario ha sido actualizado exitosamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el usuario.",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/users/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: "Usuario eliminado",
        description: "El usuario ha sido eliminado exitosamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el usuario.",
        variant: "destructive",
      });
    },
  });

  const handleCreateSubmit = (data: UserFormData) => {
    const submitData = { ...data };
    
    // Convertir tiempoSuspension a Date si existe
    if (data.tiempoSuspension) {
      submitData.tiempoSuspension = new Date(data.tiempoSuspension).toISOString();
    }
    
    // Establecer fechaSuspension cuando se suspende
    if (data.status === "suspendido") {
      submitData.fechaSuspension = new Date().toISOString();
    }
    
    createUserMutation.mutate(submitData);
  };

  const handleEditSubmit = (data: UserFormData) => {
    if (editingUser) {
      const submitData = { ...data };
      
      // Convertir tiempoSuspension a Date si existe
      if (data.tiempoSuspension) {
        submitData.tiempoSuspension = new Date(data.tiempoSuspension).toISOString();
      }
      
      // Establecer fechaSuspension cuando se suspende
      if (data.status === "suspendido") {
        submitData.fechaSuspension = new Date().toISOString();
      }
      
      updateUserMutation.mutate({ id: editingUser.id, data: submitData });
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("¿Estás seguro de que quieres eliminar este usuario?")) {
      deleteUserMutation.mutate(id);
    }
  };

  const handleCreateNew = () => {
    setIsCreateDialogOpen(true);
  };

  return (
    <div className="w-full">
      <Card className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold">Usuarios del Sistema</h2>
            <p className="text-gray-600">
              Gestiona los usuarios y sus permisos
            </p>
          </div>
          <Button
            onClick={handleCreateNew}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nuevo Usuario
          </Button>
        </div>
        <UserTable
          users={usersData?.users || []}
          total={usersData?.total || 0}
          currentPage={currentPage}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onEdit={handleEdit}
          onDelete={handleDelete}
          loading={isLoading}
        />
      </Card>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Usuario</DialogTitle>
          </DialogHeader>
          <UserForm
            onSubmit={handleCreateSubmit}
            onCancel={() => setIsCreateDialogOpen(false)}
            isLoading={createUserMutation.isPending}
            isEdit={false}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
          </DialogHeader>
          <UserForm
            onSubmit={handleEditSubmit}
            onCancel={() => {
              setIsEditDialogOpen(false);
              setEditingUser(null);
            }}
            initialData={editingUser || undefined}
            isLoading={updateUserMutation.isPending}
            isEdit={true}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}