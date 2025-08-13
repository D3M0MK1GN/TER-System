import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/use-permissions";
import { Layout } from "@/components/layout";
import { StatsCards } from "@/components/stats-cards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Plus, Edit, Mail, Clock, LayoutDashboard, Users, Settings, FileText } from "lucide-react";
import { Link, useLocation, useSearch } from "wouter";
import { UserTable } from "@/components/user-table";
import { UserForm } from "@/components/user-form";
import { PlantillasWordAdmin } from "@/components/plantillas-word-admin";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { User } from "@shared/schema";

interface DashboardStats {
  totalSolicitudes: number;
  pendientes: number;
  enviadas: number;
  respondidas: number;
  negativas: number;
  solicitudesPorOperador: { operador: string; total: number }[];
  actividadReciente: any[];
}

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
}

export default function Dashboard() {
  const { user } = useAuth();
  const permissions = usePermissions();
  const [location, navigate] = useLocation();
  const searchParams = useSearch();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  // Get the view from URL parameters, default to dashboard
  const currentView = new URLSearchParams(searchParams).get('view') || 'dashboard';
  const showUserManagement = currentView === 'users';
  const showPlantillasWordAdmin = currentView === 'plantillas-word';
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Function to change views with URL update
  const setView = (view: string) => {
    const params = new URLSearchParams();
    if (view !== 'dashboard') {
      params.set('view', view);
    }
    const search = params.toString();
    navigate(`/dashboard${search ? `?${search}` : ''}`);
  };
  
  // For users, fetch only their own stats, for admins/supervisors fetch all
  const statsEndpoint = permissions.canViewAllRequests 
    ? "/api/dashboard/stats" 
    : `/api/dashboard/stats?userId=${user?.id}`;
    
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: [statsEndpoint],
  });

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['/api/users'],
    queryFn: () => apiRequest(`/api/users?page=1&limit=50`),
    enabled: permissions.canManageUsers && showUserManagement,
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

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
      deleteUserMutation.mutate(id);
    }
  };

  const handleCreateUser = (data: UserFormData) => {
    createUserMutation.mutate(data);
  };

  const handleUpdateUser = (data: UserFormData) => {
    if (editingUser) {
      updateUserMutation.mutate({ id: editingUser.id, data });
    }
  };

  if (isLoading) {
    return (
      <Layout title="Panel de Control" subtitle="Cargando estadísticas...">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando estadísticas...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!stats) {
    return (
      <Layout title="Panel de Control" subtitle="Error cargando datos">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <p className="text-gray-600">Error cargando estadísticas</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Panel de Control" subtitle="Gestiona tu sistema desde aquí">
      <div className="p-6">
        {/* Quick Access Buttons */}
        <div className="mb-6 flex gap-3">
              {/* Dashboard Button */}
              <button 
                className={`flex items-center space-x-2 px-3 py-2 text-left rounded-lg transition-colors ${
                  !showUserManagement 
                    ? 'bg-blue-50 border border-blue-200 text-blue-700' 
                    : 'hover:bg-gray-50 border border-transparent'
                }`}
                onClick={() => setView('dashboard')}
              >
                <div className={`p-1.5 rounded ${!showUserManagement ? 'bg-blue-100' : 'bg-blue-100'}`}>
                  <LayoutDashboard className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Dashboard</h3>
                  <p className="text-xs text-gray-500">Estadísticas del sistema</p>
                </div>
              </button>
              
              {/* User Management Button - Only visible for administrators */}
              {permissions.canManageUsers && (
                <button 
                  className={`flex items-center space-x-2 px-3 py-2 text-left rounded-lg transition-colors ${
                    showUserManagement 
                      ? 'bg-green-50 border border-green-200 text-green-700' 
                      : 'hover:bg-gray-50 border border-transparent'
                  }`}
                  onClick={() => setView('users')}
                >
                  <div className={`p-1.5 rounded ${showUserManagement ? 'bg-green-100' : 'bg-green-100'}`}>
                    <Users className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Administrador de Usuarios</h3>
                    <p className="text-xs text-gray-500">Gestionar usuarios</p>
                  </div>
                </button>
              )}
              
              {/* Plantillas Word Admin Button - Only visible for administrators */}
              {permissions.canManageUsers && (
                <button 
                  className={`flex items-center space-x-2 px-3 py-2 text-left rounded-lg transition-colors ${
                    showPlantillasWordAdmin 
                      ? 'bg-purple-50 border border-purple-200 text-purple-700' 
                      : 'hover:bg-gray-50 border border-transparent'
                  }`}
                  onClick={() => setView('plantillas-word')}
                >
                  <div className={`p-1.5 rounded ${showPlantillasWordAdmin ? 'bg-purple-100' : 'bg-purple-100'}`}>
                    <FileText className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Plantillas Word</h3>
                    <p className="text-xs text-gray-500">Gestionar plantillas de documentos</p>
                  </div>
                </button>
              )}
        </div>
        
        {!showUserManagement && !showPlantillasWordAdmin ? (
            <>
              {/* Stats Cards */}
              <div className="mb-8">
                <StatsCards stats={stats ? {
                  totalSolicitudes: stats.totalSolicitudes,
                  pendientes: stats.pendientes,
                  enviadas: stats.enviadas,
                  respondidas: stats.respondidas,
                  negativas: stats.negativas
                } : {
                  totalSolicitudes: 0,
                  pendientes: 0,
                  enviadas: 0,
                  respondidas: 0,
                  negativas: 0
                }} />
              </div>

              {/* Charts and Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Chart Card */}
                <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-semibold">
                  Solicitudes por Operador
                </CardTitle>
                <Select defaultValue="ultimo-mes">
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ultimo-mes">Último mes</SelectItem>
                    <SelectItem value="ultimos-3-meses">Últimos 3 meses</SelectItem>
                    <SelectItem value="ultimo-ano">Último año</SelectItem>
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(stats?.solicitudesPorOperador || []).map((item: any, index: number) => {
                    const colors = [
                      "bg-blue-500",
                      "bg-green-500",
                      "bg-red-500",
                      "bg-purple-500",
                      "bg-yellow-500",
                    ];
                    const percentage = (stats?.totalSolicitudes || 0) > 0 
                      ? (item.total / (stats?.totalSolicitudes || 1)) * 100 
                      : 0;
                    
                    return (
                      <div key={item.operador} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-4 h-4 ${colors[index % colors.length]} rounded-full`}></div>
                          <span className="text-sm text-gray-600 capitalize">
                            {item.operador}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Progress value={percentage} className="w-32" />
                          <span className="text-sm font-medium">{item.total}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">
                  Actividad Reciente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(stats?.actividadReciente || []).length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No hay actividad reciente
                    </div>
                  ) : (
                    (stats?.actividadReciente || []).map((activity: any, index: number) => {
                      const icons = {
                        completado: { icon: CheckCircle, color: "bg-green-100 text-green-600" },
                        procesando: { icon: Clock, color: "bg-yellow-100 text-yellow-600" },
                        enviada: { icon: Mail, color: "bg-blue-100 text-blue-600" },
                        rechazada: { icon: Edit, color: "bg-red-100 text-red-600" },
                      };
                      
                      const iconInfo = icons[activity.estado as keyof typeof icons] || icons.procesando;
                      const Icon = iconInfo.icon;
                      
                      return (
                        <div key={index} className="flex items-start space-x-3">
                          <div className={`${iconInfo.color} p-2 rounded-full`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800">
                              Solicitud #{activity.numeroSolicitud} - {activity.estado}
                            </p>
                            <p className="text-xs text-gray-500">
                              Operador: {activity.operador} - {
                                new Date(activity.updatedAt).toLocaleString()
                              }
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
                <div className="mt-4 text-center">
                  <Button variant="link" className="text-sm text-primary hover:underline">
                    Ver toda la actividad
                  </Button>
                </div>
              </CardContent>
                </Card>
              </div>
            </>
          ) : showUserManagement ? (
            /* User Management Full View */
            <div className="max-w-full overflow-hidden">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Administrador de Usuarios</h2>
                  <p className="text-gray-600">Gestiona todos los usuarios del sistema</p>
                </div>
                <Button
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Agregar Usuario</span>
                </Button>
              </div>

              <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                <div className="p-6">
                  {usersLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-gray-600">Cargando usuarios...</p>
                      </div>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <UserTable
                        users={usersData?.users || []}
                        total={usersData?.users?.length || 0}
                        currentPage={1}
                        pageSize={50}
                        onPageChange={() => {}}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : showPlantillasWordAdmin ? (
            /* Plantillas Word Admin Full View */
            <div className="max-w-full overflow-hidden">
              <PlantillasWordAdmin />
            </div>
          ) : null}
        </div>
      
      {/* User Creation Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Usuario</DialogTitle>
          </DialogHeader>
          <UserForm
            onSubmit={handleCreateUser}
            onCancel={() => setIsCreateDialogOpen(false)}
            isLoading={createUserMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* User Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
          </DialogHeader>
          <UserForm
            user={editingUser}
            onSubmit={handleUpdateUser}
            onCancel={() => setIsEditDialogOpen(false)}
            isLoading={updateUserMutation.isPending}
            isEdit={true}
          />
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
