import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { StatsCards } from "@/components/stats-cards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Plus, Edit, Mail, Clock } from "lucide-react";

interface DashboardStats {
  totalSolicitudes: number;
  pendientes: number;
  enviadas: number;
  respondidas: number;
  rechazadas: number;
  solicitudesPorOperador: { operador: string; total: number }[];
  actividadReciente: any[];
}

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  if (isLoading) {
    return (
      <div className="ml-64 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando estadísticas...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="ml-64 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">Error cargando estadísticas</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="ml-64 min-h-screen">
        <Header
          title="Dashboard"
          subtitle="Resumen general del sistema"
        />
        
        <main className="p-6">
          {/* Stats Cards */}
          <div className="mb-8">
            <StatsCards stats={stats ? {
              totalSolicitudes: stats.totalSolicitudes,
              pendientes: stats.pendientes,
              enviadas: stats.enviadas,
              respondidas: stats.respondidas,
              rechazadas: stats.rechazadas
            } : {
              totalSolicitudes: 0,
              pendientes: 0,
              enviadas: 0,
              respondidas: 0,
              rechazadas: 0
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
                        pendiente: { icon: Clock, color: "bg-yellow-100 text-yellow-600" },
                        enviada: { icon: Mail, color: "bg-blue-100 text-blue-600" },
                        rechazada: { icon: Edit, color: "bg-red-100 text-red-600" },
                      };
                      
                      const iconInfo = icons[activity.estado as keyof typeof icons] || icons.pendiente;
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
        </main>
      </div>
    </div>
  );
}
