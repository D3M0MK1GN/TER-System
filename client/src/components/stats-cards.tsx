import { Card, CardContent } from "@/components/ui/card";
import { FileText, Clock, CheckCircle, Users, TrendingUp } from "lucide-react";

interface StatsCardsProps {
  stats: {
    totalSolicitudes: number;
    pendientes: number;
    enviadas: number;
    respondidas: number;
    rechazadas: number;
  };
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: "Total Solicitudes",
      value: stats.totalSolicitudes,
      icon: FileText,
      color: "bg-blue-100",
      iconColor: "text-blue-600",
      trend: "+12%",
      trendText: "vs mes anterior",
      trendColor: "text-green-600",
    },
    {
      title: "Pendientes",
      value: stats.pendientes,
      icon: Clock,
      color: "bg-yellow-100",
      iconColor: "text-yellow-600",
      trend: "Requieren atención",
      trendText: "",
      trendColor: "text-yellow-600",
    },
    {
      title: "Completadas",
      value: stats.respondidas,
      icon: CheckCircle,
      color: "bg-green-100",
      iconColor: "text-green-600",
      trend: `${stats.totalSolicitudes > 0 ? Math.round((stats.respondidas / stats.totalSolicitudes) * 100) : 0}%`,
      trendText: "tasa de éxito",
      trendColor: "text-green-600",
    },
    {
      title: "Rechazadas",
      value: stats.rechazadas,
      icon: Users,
      color: "bg-red-100",
      iconColor: "text-red-600",
      trend: stats.rechazadas > 0 ? "Requieren revisión" : "Sin rechazos",
      trendText: "",
      trendColor: stats.rechazadas > 0 ? "text-red-600" : "text-green-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index} className="border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                </div>
                <div className={`${card.color} p-3 rounded-full`}>
                  <Icon className={`h-5 w-5 ${card.iconColor}`} />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className={`flex items-center ${card.trendColor}`}>
                  <TrendingUp className="mr-1 h-3 w-3" />
                  {card.trend}
                </span>
                {card.trendText && (
                  <span className="text-gray-600 ml-2">{card.trendText}</span>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
