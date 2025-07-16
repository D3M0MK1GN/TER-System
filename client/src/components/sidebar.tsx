import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileText,
  Mail,
  BarChart3,
  User,
  LogOut,
  Antenna,
} from "lucide-react";

const navItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Gestión de Solicitudes",
    href: "/solicitudes",
    icon: FileText,
  },
  {
    title: "Plantillas de Correo",
    href: "/plantillas",
    icon: Mail,
  },
  {
    title: "Reportes",
    href: "/reportes",
    icon: BarChart3,
  },
];

export function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  return (
    <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg">
      <div className="flex items-center justify-center h-16 bg-primary text-white">
        <div className="flex items-center space-x-3">
          <Antenna className="h-6 w-6" />
          <span className="font-bold text-lg">SistelCom</span>
        </div>
      </div>

      <nav className="mt-8">
        <div className="px-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start px-4 py-3 h-auto font-normal",
                    isActive && "bg-blue-50 text-primary hover:bg-blue-50"
                  )}
                >
                  <Icon className="mr-3 h-4 w-4" />
                  {item.title}
                </Button>
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="absolute bottom-0 w-full p-4 border-t">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium">{user?.nombre}</p>
            <p className="text-xs text-gray-500">{user?.rol}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          onClick={logout}
          className="w-full justify-start px-4 py-2 text-red-600 hover:bg-red-50 hover:text-red-700"
        >
          <LogOut className="mr-3 h-4 w-4" />
          Cerrar Sesión
        </Button>
      </div>
    </div>
  );
}
