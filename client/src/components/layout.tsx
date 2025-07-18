import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { useSidebarContext } from "@/hooks/use-sidebar-context";

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export function Layout({ children, title = "SistelCom", subtitle = "Sistema de Gestión de Solicitudes" }: LayoutProps) {
  const { isOpen } = useSidebarContext();
  
  return (
    <div className="h-screen bg-gray-50 flex">
      <Sidebar />
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${
        isOpen ? 'ml-64' : 'ml-16'
      }`}>
        <Header title={title} subtitle={subtitle} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}