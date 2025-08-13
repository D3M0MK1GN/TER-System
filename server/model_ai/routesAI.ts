// server/model_ai/routesAI.ts
// Rutas del Chatbot AI - TER-System

import type { Express } from "express";
import multer from "multer";
import { unlinkSync, existsSync, mkdirSync } from "fs";
import path from "path";
import { processTextMessage, processFileMessage, getMimeType } from "./gemini";

// Configure multer for chatbot file uploads
const chatbotUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const chatDir = path.join(process.cwd(), 'uploads', 'chatbot');
      if (!existsSync(chatDir)) {
        mkdirSync(chatDir, { recursive: true });
      }
      cb(null, chatDir);
    },
    filename: (req, file, cb) => {
      const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}-${file.originalname}`;
      cb(null, uniqueName);
    }
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for chatbot files
  },
  fileFilter: (req, file, cb) => {
    const supportedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'text/plain',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ];
    
    if (supportedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no soportado para el chatbot') as any, false);
    }
  }
});

/**
 * Registra todas las rutas relacionadas con el chatbot AI
 * @param app - Aplicación Express
 * @param authenticateToken - Middleware de autenticación
 * @param requireAdmin - Middleware de autorización para administradores
 * @param storage - Instancia de almacenamiento de datos
 */
export function registerChatbotRoutes(
  app: Express, 
  authenticateToken: any, 
  requireAdmin: any, 
  storage: any
): void {

  // ===============================
  // RUTA PRINCIPAL DEL CHATBOT
  // ===============================
  
  /**
   * POST /api/chatbot/message
   * Procesa mensajes del usuario al chatbot, incluyendo archivos adjuntos
   */
  app.post("/api/chatbot/message", authenticateToken, chatbotUpload.single('file'), async (req: any, res) => {
    try {
      const { message } = req.body;
      const file = req.file;

      if (!message && !file) {
        return res.status(400).json({ message: "Se requiere un mensaje o archivo" });
      }

      // Check if user can send messages (limits and enabled status)
      const canSend = await storage.incrementUserChatbotMessages(req.user.id);
      if (!canSend) {
        const status = await storage.getUserChatbotStatus(req.user.id);
        if (!status.habilitado) {
          return res.status(403).json({ 
            message: "El chatbot está deshabilitado para tu cuenta. Contacta al administrador." 
          });
        } else {
          return res.status(429).json({ 
            message: `Has alcanzado el límite de ${status.limite} mensajes. Contacta al administrador para aumentar tu límite.` 
          });
        }
      }

      let response: string;

      if (file) {
        // Process message with file
        const mimeType = getMimeType(file.originalname);
        if (!mimeType) {
          // Clean up uploaded file
          unlinkSync(file.path);
          return res.status(400).json({ message: "Tipo de archivo no soportado" });
        }

        response = await processFileMessage(
          message || "Analiza este archivo y proporciona un resumen detallado.",
          file.path,
          mimeType
        );

        // Clean up uploaded file after processing
        try {
          unlinkSync(file.path);
        } catch (cleanupError) {
          // Log cleanup error but don't fail the request
        }
      } else {
        // Process text-only message
        response = await processTextMessage(message);
      }

      // Save the message and response to database
      await storage.saveChatbotMessage(
        req.user.id,
        message || "Archivo adjunto",
        response,
        !!file,
        file?.originalname
      );

      res.json({ response });
    } catch (error: any) {
      // Clean up file if it exists and there was an error
      if (req.file) {
        try {
          unlinkSync(req.file.path);
        } catch (cleanupError) {
          // Ignore cleanup errors
        }
      }

      res.status(500).json({ 
        message: "Error procesando mensaje del chatbot", 
        error: error.message 
      });
    }
  });

  // ===============================
  // RUTAS DE ESTADO DEL CHATBOT
  // ===============================

  /**
   * GET /api/chatbot/status
   * Obtiene el estado actual del chatbot para el usuario autenticado
   */
  app.get("/api/chatbot/status", authenticateToken, async (req: any, res) => {
    try {
      const status = await storage.getUserChatbotStatus(req.user.id);
      res.json(status);
    } catch (error) {
      res.status(500).json({ message: "Error obteniendo estado del chatbot" });
    }
  });

  // ===============================
  // RUTAS ADMINISTRATIVAS DEL CHATBOT
  // ===============================

  /**
   * GET /api/admin/chatbot/users
   * Obtiene estadísticas de todos los usuarios del chatbot (solo administradores)
   */
  app.get("/api/admin/chatbot/users", authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const usersWithStats = await storage.getUsersWithChatbotStats();
      res.json(usersWithStats);
    } catch (error) {
      res.status(500).json({ message: "Error obteniendo estadísticas de usuarios del chatbot" });
    }
  });

  /**
   * POST /api/admin/chatbot/update-limits
   * Actualiza límites y estado del chatbot para múltiples usuarios (solo administradores)
   */
  app.post("/api/admin/chatbot/update-limits", authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const { updates } = req.body;
      
      if (!Array.isArray(updates)) {
        return res.status(400).json({ message: "Se requiere un array de actualizaciones" });
      }

      // Validate each update
      for (const update of updates) {
        if (!update.userId || typeof update.limite !== 'number' || typeof update.habilitado !== 'boolean') {
          return res.status(400).json({ message: "Formato de actualización inválido" });
        }
      }

      await storage.bulkUpdateChatbotLimits(updates);
      res.json({ message: "Límites del chatbot actualizados exitosamente" });
    } catch (error) {
      res.status(500).json({ message: "Error actualizando límites del chatbot" });
    }
  });

  /**
   * POST /api/admin/chatbot/reset-messages/:userId
   * Resetea el contador de mensajes para un usuario específico (solo administradores)
   */
  app.post("/api/admin/chatbot/reset-messages/:userId", authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "ID de usuario inválido" });
      }

      await storage.resetUserChatbotMessages(userId);
      res.json({ message: "Mensajes del chatbot reseteados exitosamente" });
    } catch (error) {
      res.status(500).json({ message: "Error reseteando mensajes del chatbot" });
    }
  });

  // ===============================
  // CONFIGURACIÓN GLOBAL DEL CHATBOT
  // ===============================

  /**
   * GET /api/admin/chatbot/config/:key
   * Obtiene una configuración específica del chatbot (solo administradores)
   */
  app.get("/api/admin/chatbot/config/:key", authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const config = await storage.getChatbotConfig(req.params.key);
      res.json(config || { valor: null });
    } catch (error) {
      res.status(500).json({ message: "Error obteniendo configuración del chatbot" });
    }
  });

  /**
   * POST /api/admin/chatbot/config
   * Guarda una configuración del chatbot (solo administradores)
   */
  app.post("/api/admin/chatbot/config", authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const { clave, valor, descripcion } = req.body;
      
      if (!clave || !valor) {
        return res.status(400).json({ message: "Clave y valor son requeridos" });
      }

      await storage.setChatbotConfig(clave, valor, req.user.id, descripcion);
      res.json({ message: "Configuración guardada exitosamente" });
    } catch (error) {
      res.status(500).json({ message: "Error guardando configuración del chatbot" });
    }
  });
}