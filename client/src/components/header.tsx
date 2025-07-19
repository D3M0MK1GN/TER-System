import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { NotificationsDropdown } from "@/components/notifications-dropdown";

interface HeaderProps {
  title: string;
  subtitle: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const { user } = useAuth();

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
        if (newWindow && newWindow.document) {
          newWindow.document.open();
          newWindow.document.write(htmlContent);
          newWindow.document.close();
        }
      } else {
        // Error fetching guide - handle silently
      }
    } catch (error) {
      // Error generating guide - handle silently
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 h-20 flex items-center justify-between px-2 sm:px-6 overflow-hidden">
      <div className="flex-shrink min-w-0 max-w-[60%] header-left">
        <h1 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-800 truncate leading-tight header-title">{title}</h1>
        <p className="text-sm sm:text-base text-gray-600 header-subtitle truncate">{subtitle}</p>
      </div>
      <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-4 flex-shrink-0 min-w-0 max-w-[40%] header-right">
        <NotificationsDropdown />
        
        <div className="text-xs sm:text-sm text-gray-600 hidden lg:block truncate">
          <span className="font-medium">{user?.nombre}</span>
          <span className="text-gray-400 ml-1">({user?.rol})</span>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleGenerateGuide}
          className="flex items-center space-x-1 text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 h-8 sm:h-9"
        >
          <HelpCircle className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">Guía</span>
          <span className="sm:hidden">?</span>
        </Button>
      </div>
    </header>
  );
}
