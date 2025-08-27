import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  count: number;
  color: string;
}

export function StatCard({ icon: Icon, label, count, color }: StatCardProps) {
  const colorClasses = {
    blue: "text-blue-600",
    green: "text-green-600",
    red: "text-red-600",
    yellow: "text-yellow-600",
    orange: "text-orange-600",
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col space-y-1 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div className="flex items-center space-x-2">
            <Icon className={`h-5 w-5 ${colorClasses[color as keyof typeof colorClasses] || "text-gray-600"}`} />
            <p className="text-sm font-medium text-gray-600">{label}</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{count}</p>
        </div>
      </CardContent>
    </Card>
  );
}