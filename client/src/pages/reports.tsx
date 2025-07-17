import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/use-permissions";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { BarChart3, Download, TrendingUp, Calendar, Users, FileText } from "lucide-react";

interface DashboardStats {
  totalSolicitudes: number;
  pendientes: number;
  enviadas: number;
  respondidas: number;
  rechazadas: number;
  solicitudesPorOperador: { operador: string; total: number }[];
  actividadReciente: any[];
}

export default function Reports() {
  const { user } = useAuth();
  const permissions = usePermissions();
  
  // For users, fetch only their own stats, for admins/supervisors fetch all
  const statsEndpoint = permissions.canViewAllReports 
    ? "/api/dashboard/stats" 
    : `/api/dashboard/stats?userId=${user?.id}`;
    
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: [statsEndpoint],
  });

  const operatorColors = {
    movistar: "bg-blue-500",
    claro: "bg-green-500",
    entel: "bg-red-500",
    bitel: "bg-purple-500",
    otros: "bg-yellow-500",
  };

  const formatOperator = (operador: string) => {
    const names = {
      movistar: "Movistar",
      claro: "Claro",
      entel: "Entel",
      bitel: "Bitel",
      otros: "Otros",
    };
    return names[operador as keyof typeof names] || operador;
  };

  const getEfficiencyRate = () => {
    if (!stats || stats.totalSolicitudes === 0) return 0;
    return Math.round((stats.respondidas / stats.totalSolicitudes) * 100);
  };

  const getPendingRate = () => {
    if (!stats || stats.totalSolicitudes === 0) return 0;
    return Math.round((stats.pendientes / stats.totalSolicitudes) * 100);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="ml-64 min-h-screen">
        <Header
          title="Reportes y Análisis"
          subtitle="Estadísticas y métricas del sistema"
        />
        
        <main className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Dashboard de Reportes</h2>
            <div className="flex items-center space-x-4">
              <Select defaultValue="ultimo-mes">
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ultima-semana">Última semana</SelectItem>
                  <SelectItem value="ultimo-mes">Último mes</SelectItem>
                  <SelectItem value="ultimos-3-meses">Últimos 3 meses</SelectItem>
                  <SelectItem value="ultimo-ano">Último año</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Exportar
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-gray-600">Cargando reportes...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Métricas Principales */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-gray-600">
                        Total Solicitudes
                      </CardTitle>
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-900">
                      {stats?.totalSolicitudes || 0}
                    </div>
                    <div className="flex items-center mt-2">
                      <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                      <span className="text-sm text-green-600">+12% vs mes anterior</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-gray-600">
                        Tasa de Eficiencia
                      </CardTitle>
                      <BarChart3 className="h-5 w-5 text-green-600" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-900">
                      {getEfficiencyRate()}%
                    </div>
                    <div className="mt-2">
                      <Progress value={getEfficiencyRate()} className="h-2" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-gray-600">
                        Tiempo Promedio
                      </CardTitle>
                      <Calendar className="h-5 w-5 text-orange-600" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-900">
                      5.2 días
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      De procesamiento
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-gray-600">
                        Operadores Activos
                      </CardTitle>
                      <Users className="h-5 w-5 text-purple-600" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-900">
                      {stats?.solicitudesPorOperador?.length || 0}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      Con solicitudes
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Análisis por Operador */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">
                      Distribución por Operador
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {(stats?.solicitudesPorOperador || []).map((item, index) => {
                        const colors = ["bg-blue-500", "bg-green-500", "bg-red-500", "bg-purple-500", "bg-yellow-500"];
                        const percentage = (stats?.totalSolicitudes || 0) > 0 
                          ? (item.total / (stats?.totalSolicitudes || 1)) * 100 
                          : 0;
                        
                        return (
                          <div key={item.operador} className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className={`w-4 h-4 ${colors[index % colors.length]} rounded-full`}></div>
                              <span className="text-sm font-medium text-gray-700">
                                {formatOperator(item.operador)}
                              </span>
                            </div>
                            <div className="flex items-center space-x-3">
                              <div className="w-32">
                                <Progress value={percentage} className="h-2" />
                              </div>
                              <span className="text-sm font-medium text-gray-900 w-12 text-right">
                                {item.total}
                              </span>
                              <span className="text-sm text-gray-600 w-12 text-right">
                                {percentage.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">
                      Estado de Solicitudes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { label: "Pendientes", value: stats?.pendientes || 0, color: "bg-yellow-500" },
                        { label: "Enviadas", value: stats?.enviadas || 0, color: "bg-blue-500" },
                        { label: "Respondidas", value: stats?.respondidas || 0, color: "bg-green-500" },
                        { label: "Rechazadas", value: stats?.rechazadas || 0, color: "bg-red-500" },
                      ].map((item) => {
                        const percentage = (stats?.totalSolicitudes || 0) > 0 
                          ? (item.value / (stats?.totalSolicitudes || 1)) * 100 
                          : 0;
                        
                        return (
                          <div key={item.label} className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className={`w-4 h-4 ${item.color} rounded-full`}></div>
                              <span className="text-sm font-medium text-gray-700">
                                {item.label}
                              </span>
                            </div>
                            <div className="flex items-center space-x-3">
                              <div className="w-32">
                                <Progress value={percentage} className="h-2" />
                              </div>
                              <span className="text-sm font-medium text-gray-900 w-12 text-right">
                                {item.value}
                              </span>
                              <span className="text-sm text-gray-600 w-12 text-right">
                                {percentage.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Tendencias */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">
                    Resumen de Rendimiento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">
                        {getEfficiencyRate()}%
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        Tasa de Resolución
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-yellow-600">
                        {getPendingRate()}%
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        Solicitudes Pendientes
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">
                        5.2
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        Días Promedio
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}