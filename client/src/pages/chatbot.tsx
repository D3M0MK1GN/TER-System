import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiRequest } from "@/lib/queryClient";
import { Send, Paperclip, User, Loader2, Trash2, AlertCircle, MessageSquare } from "lucide-react";
import { Layout } from "@/components/layout";
import { useAuth } from "@/hooks/use-auth";

interface Message {
  id: string;
  type: "user" | "bot";
  content: string;
  timestamp: Date;
  hasFile?: boolean;
  fileName?: string;
}

interface ChatbotStatus {
  habilitado: boolean;
  mensajesUsados: number;
  limite: number;
}

// Clave para localStorage basada en el usuario actual
const getChatStorageKey = () => {
  const token = localStorage.getItem("token");
  if (!token) return "chatbot-messages-guest";
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return `chatbot-messages-${payload.id || 'unknown'}`;
  } catch {
    return "chatbot-messages-default";
  }
};

// Mensaje de bienvenida por defecto
const getWelcomeMessage = (): Message => ({
  id: "welcome",
  type: "bot",
  content: "¡Hola! Soy tu asistente de IA especializado en telecomunicaciones. Puedo ayudarte con análisis de texto y archivos. ¿En qué puedo asistirte hoy?",
  timestamp: new Date(),
});

// Funciones para persistencia de mensajes
const loadMessages = (): Message[] => {
  try {
    const stored = localStorage.getItem(getChatStorageKey());
    if (!stored) return [getWelcomeMessage()];
    
    const parsed = JSON.parse(stored);
    return parsed.map((msg: any) => ({
      ...msg,
      timestamp: new Date(msg.timestamp)
    }));
  } catch {
    return [getWelcomeMessage()];
  }
};

const saveMessages = (messages: Message[]) => {
  try {
    localStorage.setItem(getChatStorageKey(), JSON.stringify(messages));
  } catch (error) {
    console.warn("No se pudieron guardar los mensajes:", error);
  }
};

// Función para limpiar mensajes del chatbot al cerrar sesión (solo para no-admin)
export const clearChatbotMessagesOnLogout = () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) return;
    
    // Verificar el rol del usuario desde el token
    const payload = JSON.parse(atob(token.split('.')[1]));
    const userRole = payload.rol;
    
    // Solo limpiar mensajes si NO es administrador
    if (userRole !== 'admin') {
      const storageKey = getChatStorageKey();
      localStorage.removeItem(storageKey);
    }
  } catch (error) {
    // Si hay error leyendo el token, no hacer nada
  }
};

export default function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Get current user info from auth
  const { user: currentUser } = useAuth();

  // Get user chatbot status
  const { data: chatbotStatus, refetch: refetchStatus } = useQuery<ChatbotStatus>({
    queryKey: ["/api/chatbot/status"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Load messages on component mount - all users now have persistence until logout
  useEffect(() => {
    const savedMessages = loadMessages();
    if (savedMessages && savedMessages.length > 0) {
      setMessages(savedMessages);
    } else {
      // Si no hay mensajes guardados, agregar mensaje de bienvenida
      const welcomeMessage = getWelcomeMessage();
      setMessages([welcomeMessage]);
      saveMessages([welcomeMessage]);
    }
  }, [currentUser]);



  const sendMessageMutation = useMutation({
    mutationFn: async ({ message, file }: { message: string; file?: File }) => {
      const formData = new FormData();
      formData.append("message", message);
      
      if (file) {
        formData.append("file", file);
      }

      const response = await fetch("/api/chatbot/message", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Error al enviar mensaje");
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Add bot response
      const botMessage: Message = {
        id: Date.now() + "-bot",
        type: "bot",
        content: data.response,
        timestamp: new Date(),
      };
      
      // Always save to localStorage first to persist across navigation
      const currentMessages = loadMessages();
      const newMessages = [...currentMessages, botMessage];
      saveMessages(newMessages);
      
      // Update state only if component is still mounted
      setMessages(newMessages);

      // Refresh chatbot status to get updated message count
      if (currentUser?.rol !== 'admin') {
        refetchStatus();
      }
    },
    onError: (error: any) => {
      let errorMessage = "No se pudo enviar el mensaje. Inténtalo de nuevo.";
      
      // Handle specific error cases (only for non-admin users)
      if (currentUser?.rol !== 'admin') {
        if (error?.message?.includes("403")) {
          errorMessage = "El chatbot está deshabilitado para tu cuenta. Contacta al administrador.";
        } else if (error?.message?.includes("429")) {
          errorMessage = "Has alcanzado tu límite de mensajes. Contacta al administrador para aumentar tu límite.";
        }
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      // Refresh status to get current limits (only for non-admin users)
      if (currentUser?.rol !== 'admin') {
        refetchStatus();
      }
    }
  });

  const handleSendMessage = () => {
    if (!inputMessage.trim() && !selectedFile) return;

    // Add user message to chat
    const userMessage: Message = {
      id: Date.now() + "-user",
      type: "user",
      content: inputMessage || "Archivo adjunto",
      timestamp: new Date(),
      hasFile: !!selectedFile,
      fileName: selectedFile?.name,
    };

    // Save user message immediately to localStorage and update state
    const currentMessages = loadMessages();
    const newMessages = [...currentMessages, userMessage];
    saveMessages(newMessages);
    setMessages(newMessages);

    // Send message to API
    sendMessageMutation.mutate({
      message: inputMessage,
      file: selectedFile || undefined,
    });

    // Reset form
    setInputMessage("");
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const supportedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'text/plain',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ];

    if (!supportedTypes.includes(file.type)) {
      toast({
        title: "Tipo de archivo no soportado",
        description: "Solo se permiten archivos: JPG, PNG, GIF, WebP, PDF, TXT, DOC, DOCX",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast({
        title: "Archivo muy grande",
        description: "El archivo no debe superar los 10MB.",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    toast({
      title: "Archivo seleccionado",
      description: `${file.name} está listo para enviar.`,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Función para limpiar el historial de mensajes
  const clearChatHistory = () => {
    // For all users, keep welcome message and save to localStorage
    const welcomeMessage = getWelcomeMessage();
    setMessages([welcomeMessage]);
    saveMessages([welcomeMessage]);
    toast({
      title: "Historial limpiado",
      description: "Se ha eliminado el historial de conversación",
    });
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="/cicipc-32x32.png" className="h-8 w-8 ml-2" alt="Chatbot" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Chatbot IA</h1>
              <p className="text-gray-600">Asistente Inteligente de Telecomunicaciones</p>
            </div>
          </div>
          <div className="flex items-center gap-4 mr-4">
            {chatbotStatus && currentUser?.rol !== 'admin' && (
              <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-lg">
                <MessageSquare className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {chatbotStatus.mensajesUsados}/{chatbotStatus.limite} mensajes
                </span>
                {!chatbotStatus.habilitado && (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                )}
              </div>
            )}
            {currentUser?.rol === 'admin' && (
              <div className="flex items-center gap-2 px-3 py-1 bg-green-100 rounded-lg">
                <MessageSquare className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-700">
                  Acceso ilimitado
                </span>
              </div>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearChatHistory}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Limpiar historial
            </Button>
          </div>
        </div>

        {chatbotStatus && !chatbotStatus.habilitado && currentUser?.rol !== 'admin' && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              El chatbot está deshabilitado para tu cuenta. Contacta al administrador para habilitarlo.
            </AlertDescription>
          </Alert>
        )}

        {chatbotStatus && chatbotStatus.habilitado && chatbotStatus.mensajesUsados >= chatbotStatus.limite && currentUser?.rol !== 'admin' && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Has alcanzado tu límite de {chatbotStatus.limite} mensajes. Contacta al administrador para aumentar tu límite.
            </AlertDescription>
          </Alert>
        )}

        <Card className="h-[calc(100vh-12rem)] flex flex-col">
        
        <CardContent className="flex-1 flex flex-col p-0">
          {/* Messages Area */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.type === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.type === "bot" && (
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <img src="/cicipc-32x32.png" className="h-5 w-5" alt="Bot" />
                    </div>
                  )}
                  
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      message.type === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    {message.hasFile && message.fileName && (
                      <div className="mt-2 text-xs opacity-75 flex items-center gap-1">
                        <Paperclip className="h-3 w-3" />
                        {message.fileName}
                      </div>
                    )}
                    <div className="text-xs opacity-75 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>

                  {message.type === "user" && (
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>
              ))}
              
              {sendMessageMutation.isPending && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <img src="/cicipc-32x32.png" className="h-5 w-5" alt="Bot" />
                  </div>
                  <div className="bg-gray-100 text-gray-900 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Procesando...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="border-t p-4">
            {selectedFile && (
              <div className="mb-3 p-2 bg-blue-50 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-blue-700">
                  <Paperclip className="h-4 w-4" />
                  {selectedFile.name}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedFile(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
                  }}
                  className="text-blue-700 hover:text-blue-900"
                >
                  ✕
                </Button>
              </div>
            )}
            
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.txt,.doc,.docx"
                className="hidden"
              />
              
              <Button
                variant="outline"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={sendMessageMutation.isPending}
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Escribe tu mensaje aquí..."
                disabled={sendMessageMutation.isPending}
                className="flex-1"
              />
              
              <Button
                onClick={handleSendMessage}
                disabled={
                  sendMessageMutation.isPending || 
                  (!inputMessage.trim() && !selectedFile) ||
                  (currentUser?.rol !== 'admin' && chatbotStatus && (!chatbotStatus.habilitado || chatbotStatus.mensajesUsados >= chatbotStatus.limite))
                }
              >
                {sendMessageMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            <p className="text-xs text-gray-500 mt-2">
              Puedes adjuntar imágenes (JPG, PNG, GIF, WebP), documentos (PDF, DOC, DOCX) o archivos de texto (TXT). Máximo 10MB.
            </p>
          </div>
        </CardContent>
        </Card>
      </div>
    </Layout>
  );
}