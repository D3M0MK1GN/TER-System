import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Settings, RefreshCw, MessageSquare, Users, Save } from "lucide-react";

interface ChatbotUserStats {
  usuario: {
    id: number;
    nombre: string;
    username: string;
    rol: string;
  };
  mensajesUsados: number;
  limite: number;
  habilitado: boolean;
}

export default function ChatbotAdmin() {
  const [localUpdates, setLocalUpdates] = useState<Record<number, { limite: number; habilitado: boolean }>>({});
  const { toast } = useToast();

  const { data: usersStats, isLoading, refetch } = useQuery<ChatbotUserStats[]>({
    queryKey: ["/api/admin/chatbot/users"],
    refetchInterval: 60000, // Refresh every minute
  });

  const updateLimitsMutation = useMutation({
    mutationFn: async (updates: { userId: number; limite: number; habilitado: boolean }[]) => {
      return apiRequest("/api/admin/chatbot/update-limits", {
        method: "POST",
        body: JSON.stringify({ updates }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
    },
    onSuccess: () => {
      toast({
        title: "Éxito",
        description: "Límites del chatbot actualizados correctamente",
      });
      setLocalUpdates({});
      refetch();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/chatbot/users"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Error al actualizar límites del chatbot",
        variant: "destructive",
      });
    },
  });

  const resetMessagesMutation = useMutation({
    mutationFn: async (userId: number) => {
      return apiRequest(`/api/admin/chatbot/reset-messages/${userId}`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
      });
    },
    onSuccess: () => {
      toast({
        title: "Éxito",
        description: "Mensajes reseteados correctamente",
      });
      refetch();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Error al resetear mensajes",
        variant: "destructive",
      });
    },
  });

  const handleLimitChange = (userId: number, limite: number) => {
    setLocalUpdates(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        limite,
        habilitado: prev[userId]?.habilitado ?? getUserCurrentStatus(userId).habilitado
      }
    }));
  };

  const handleEnabledChange = (userId: number, habilitado: boolean) => {
    setLocalUpdates(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        limite: prev[userId]?.limite ?? getUserCurrentStatus(userId).limite,
        habilitado
      }
    }));
  };

  const getUserCurrentStatus = (userId: number) => {
    const user = usersStats?.find(u => u.usuario.id === userId);
    return {
      limite: user?.limite ?? 20,
      habilitado: user?.habilitado ?? true
    };
  };

  const getEffectiveLimits = (userId: number) => {
    const local = localUpdates[userId];
    const current = getUserCurrentStatus(userId);
    return {
      limite: local?.limite ?? current.limite,
      habilitado: local?.habilitado ?? current.habilitado
    };
  };

  const hasChanges = Object.keys(localUpdates).length > 0;

  const handleSaveChanges = () => {
    const updates = Object.entries(localUpdates).map(([userIdStr, data]) => ({
      userId: parseInt(userIdStr),
      limite: data.limite,
      habilitado: data.habilitado
    }));

    updateLimitsMutation.mutate(updates);
  };

  const getRoleBadgeColor = (rol: string) => {
    switch (rol) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'supervisor': return 'bg-blue-100 text-blue-800';
      case 'usuario': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Administración del Chatbot
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="ml-2">Cargando estadísticas...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Administración del Chatbot
          </CardTitle>
          <div className="flex items-center gap-2">
            {hasChanges && (
              <Button 
                onClick={handleSaveChanges}
                disabled={updateLimitsMutation.isPending}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                Guardar Cambios
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Actualizar
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Statistics Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-blue-600">Total Usuarios</p>
                  <p className="text-2xl font-bold text-blue-900">{usersStats?.length || 0}</p>
                </div>
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-600">Usuarios Activos</p>
                  <p className="text-2xl font-bold text-green-900">
                    {usersStats?.filter(u => u.habilitado).length || 0}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm font-medium text-orange-600">Total Mensajes</p>
                  <p className="text-2xl font-bold text-orange-900">
                    {usersStats?.reduce((total, u) => total + u.mensajesUsados, 0) || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead className="text-center">Mensajes Usados</TableHead>
                  <TableHead className="text-center">Límite</TableHead>
                  <TableHead className="text-center">Progreso</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                  <TableHead className="text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usersStats?.map((userStat) => {
                  const effective = getEffectiveLimits(userStat.usuario.id);
                  const progressPercentage = (userStat.mensajesUsados / effective.limite) * 100;
                  
                  return (
                    <TableRow key={userStat.usuario.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{userStat.usuario.nombre}</div>
                          <div className="text-sm text-gray-500">@{userStat.usuario.username}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getRoleBadgeColor(userStat.usuario.rol)}>
                          {userStat.usuario.rol}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center font-mono">
                        {userStat.mensajesUsados}
                      </TableCell>
                      <TableCell className="text-center">
                        <Input
                          type="number"
                          min="0"
                          max="999999"
                          value={effective.limite}
                          onChange={(e) => handleLimitChange(userStat.usuario.id, parseInt(e.target.value) || 0)}
                          className="w-20 mx-auto text-center"
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="w-full max-w-20 mx-auto">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                progressPercentage >= 100 ? 'bg-red-500' : 
                                progressPercentage >= 80 ? 'bg-yellow-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                            />
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {Math.round(progressPercentage)}%
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={effective.habilitado}
                          onCheckedChange={(checked) => handleEnabledChange(userStat.usuario.id, checked)}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => resetMessagesMutation.mutate(userStat.usuario.id)}
                          disabled={resetMessagesMutation.isPending}
                          className="text-xs"
                        >
                          Resetear
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {hasChanges && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>Tienes cambios sin guardar.</strong> Haz clic en "Guardar Cambios" para aplicar las modificaciones.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}