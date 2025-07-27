import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Send, Paperclip, Bot, User, Loader2 } from "lucide-react";

interface Message {
  id: string;
  type: "user" | "bot";
  content: string;
  timestamp: Date;
  hasFile?: boolean;
  fileName?: string;
}

export default function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      type: "bot",
      content: "¡Hola! Soy tu asistente de IA. Puedo ayudarte con análisis de texto y archivos. ¿En qué puedo asistirte hoy?",
      timestamp: new Date(),
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

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
      
      setMessages(prev => [...prev, botMessage]);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo enviar el mensaje. Inténtalo de nuevo.",
        variant: "destructive",
      });
      console.error("Error sending message:", error);
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

    setMessages(prev => [...prev, userMessage]);

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

  return (
    <div className="container mx-auto p-6 h-full">
      <Card className="h-[calc(100vh-8rem)] flex flex-col">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-6 w-6 text-blue-600" />
            Chatbot IA - Asistente Inteligente
          </CardTitle>
        </CardHeader>
        
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
                      <Bot className="h-4 w-4 text-blue-600" />
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
                    <Bot className="h-4 w-4 text-blue-600" />
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
                disabled={sendMessageMutation.isPending || (!inputMessage.trim() && !selectedFile)}
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
  );
}