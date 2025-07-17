import { Bell, Settings, HelpCircle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { NotificationsDropdown } from "@/components/notifications-dropdown";

interface HeaderProps {
  title: string;
  subtitle: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();

  const handleGenerateGuide = async () => {
    try {
      // Fetch the guide content
      const response = await fetch('/api/guide/pdf', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const htmlContent = await response.text();
        // Open in new window with the HTML content
        const newWindow = window.open('', '_blank');
        if (newWindow) {
          newWindow.document.write(htmlContent);
          newWindow.document.close();
        }
      } else {
        console.error('Error fetching guide');
      }
    } catch (error) {
      console.error('Error generating guide:', error);
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 h-16 flex items-center justify-between px-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-800">{title}</h1>
        <p className="text-sm text-gray-600">{subtitle}</p>
      </div>
      <div className="flex items-center space-x-4">
        <NotificationsDropdown />
        
        <div className="text-sm text-gray-600">
          <span className="font-medium">{user?.nombre}</span>
          <span className="text-gray-400 ml-2">({user?.rol})</span>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleGenerateGuide}
          className="flex items-center space-x-2"
        >
          <HelpCircle className="h-4 w-4" />
          <span>Guía de Usuario</span>
        </Button>
      </div>
    </header>
  );
}
