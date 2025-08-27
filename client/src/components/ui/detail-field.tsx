import { Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ReactNode } from "react";

interface DetailFieldProps {
  label: string;
  value: string | number | null | undefined;
  isMono?: boolean;
  isDate?: boolean;
  isBadge?: boolean;
  badgeVariant?: "default" | "outline";
  badgeClassName?: string;
  children?: ReactNode;
}

export function DetailField({ 
  label, 
  value, 
  isMono = false, 
  isDate = false, 
  isBadge = false,
  badgeVariant = "outline",
  badgeClassName = "",
  children
}: DetailFieldProps) {
  const displayValue = value || "No especificado";

  if (children) {
    return (
      <div>
        <label className="text-sm font-medium text-gray-600">{label}</label>
        {children}
      </div>
    );
  }

  if (isBadge && value) {
    return (
      <div>
        <label className="text-sm font-medium text-gray-600">{label}</label>
        <Badge variant={badgeVariant} className={`capitalize ${badgeClassName}`}>
          {displayValue}
        </Badge>
      </div>
    );
  }

  if (isDate) {
    return (
      <div>
        <label className="text-sm font-medium text-gray-600">{label}</label>
        <div className="flex items-center space-x-1">
          <Calendar className="h-4 w-4 text-gray-400" />
          <span className="text-sm">
            {value ? new Date(value as string).toLocaleDateString('es-ES') : "Sin fecha"}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <label className="text-sm font-medium text-gray-600">{label}</label>
      <p className={`text-sm md:text-base ${isMono ? 'font-mono' : ''} ${!value ? 'text-gray-500' : 'text-gray-800'}`}>
        {displayValue}
      </p>
    </div>
  );
}