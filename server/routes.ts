// Seccion de Rutas
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { users, personasCasos, personaTelefonos } from "@shared/schema";
import { eq, sql } from "drizzle-orm";
import {
  insertUserSchema,
  insertSolicitudSchema,
  insertPlantillaCorreoSchema,
  insertPlantillaWordSchema,
  insertExperticiasSchema,
  insertPersonaCasoSchema,
  insertPersonaTelefonoSchema,
  insertRegistroComunicacionSchema,
  loginSchema,
  type User,
} from "@shared/schema";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import multer from "multer";
import { writeFileSync, readFileSync, existsSync, mkdirSync, unlinkSync } from "fs";
import path from "path";
import { processTextMessage, processFileMessage, getMimeType, isSupportedFileType } from "./model_ai/gemini";
import { registerDocumentRoutes, generateWordDocument, generateExcelDocument } from "./routes_gest";
import { generateUserGuideHTML } from "../tools/user_gui";
import { registerChatbotRoutes } from "./model_ai/routesAI";
import { registerStatsRoutes } from "./routes-stats";
import { parseWithPrefixes } from '../tools/utils_I';

// import { readFileSync, existsSync } from 'fs';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import ExcelJS from 'exceljs';


 // Al inicio del archivo routes.ts
const swiPdf = {
  downloadAsPdf: false,
  // otros valores de configuración...
};


const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow only Word documents
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.mimetype === 'application/msword') {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos Word (.doc, .docx)') as any, false);
    }
  }
});

// Configure multer for data import files (Excel, CSV, TXT)
const uploadData = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow Excel, CSV, TXT files
    const allowedMimes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv', // .csv
      'text/plain', // .txt
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos Excel (.xlsx, .xls), CSV (.csv) o TXT (.txt)') as any, false);
    }
  }
});



// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!existsSync(uploadsDir)) {
  mkdirSync(uploadsDir, { recursive: true });
}



interface AuthenticatedRequest extends Request {
  user?: User;
}

// Middleware para verificar JWT
function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token de acceso requerido' });
  }

  jwt.verify(token, JWT_SECRET, async (err: any, decoded: any) => {
    if (err) {
      // JWT verification failed - token invalid or expired
      return res.status(403).json({ message: 'Token inválido' });
    }

    try {
      const user = await storage.getUser(decoded.id);
      if (!user) {
        return res.status(403).json({ message: 'Usuario no encontrado' });
      }

      // Check if user is active and not blocked
      if (!user.activo || user.status === 'bloqueado') {
        return res.status(403).json({ message: 'Acceso denegado' });
      }

      // Check if session is still active
      const sessionUser = await storage.getUserBySessionToken(token);
      if (!sessionUser || sessionUser.id !== user.id) {
        return res.status(403).json({ message: 'Sesión inválida o expirada' });
      }

      // Check if session has expired
      const isSessionActive = await storage.isSessionActive(user.id);
      if (!isSessionActive) {
        // Clear expired session
        await storage.clearUserSession(user.id);
        return res.status(403).json({ message: 'Sesión expirada' });
      }

      req.user = user;
      next();
    } catch (error) {
      // Authentication middleware error - handle gracefully
      return res.status(500).json({ message: 'Error interno del servidor' });
    }
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Background task to check for expired suspensions every 5 minutes
  const suspensionCheckInterval = setInterval(async () => {
    try {
      const suspendedUsers = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.status, 'suspendido'));

      const promises = suspendedUsers.map(user => storage.checkSuspensionExpired(user.id));
      await Promise.allSettled(promises);
    } catch (error) {
      // Error checking expired suspensions - background task continues
    }
  }, 5 * 60 * 1000); // 5 minutes

  // Background task to clean up old notifications every hour
  const notificationCleanupInterval = setInterval(async () => {
    try {
      await storage.cleanupOldNotifications();
    } catch (error) {
      // Error cleaning up old notifications - background task continues
    }
  }, 60 * 60 * 1000); // 1 hour

  // Cleanup intervals on server shutdown
  process.on('SIGTERM', () => {
    clearInterval(suspensionCheckInterval);
    clearInterval(notificationCleanupInterval);
  });

  process.on('SIGINT', () => {
    clearInterval(suspensionCheckInterval);
    clearInterval(notificationCleanupInterval);
  });

  // Crear usuario admin por defecto si no existe
  const adminUser = await storage.getUserByUsername("admin");
  if (!adminUser) {
    const hashedPassword = await bcrypt.hash("admin123", 10);
    await storage.createUser({
      username: "admin",
      password: hashedPassword,
      nombre: "Administrador",
      email: "admin@sistema.com",
      rol: "admin",
    });
  }

  // Auth Routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      const clientIp = (req as any).clientIp || 'unknown';
      
      const user = await storage.getUserByUsername(username);
      if (!user) {
        // Increment failed attempts for non-existent users too (security)
        return res.status(401).json({ message: "Credenciales inválidas" });
      }

      // Check if user suspension has expired
      await storage.checkSuspensionExpired(user.id);
      
      // Refetch user to get updated status
      const updatedUser = await storage.getUserByUsername(username);
      if (!updatedUser) {
        return res.status(401).json({ message: "Credenciales inválidas" });
      }

      // Check if user is suspended or blocked
      if (updatedUser.status === 'suspendido') {
        if (updatedUser.tiempoSuspension) {
          const now = new Date();
          const suspensionEnd = new Date(updatedUser.tiempoSuspension);
          if (now < suspensionEnd) {
            const timeLeftMs = suspensionEnd.getTime() - now.getTime();
            const hours = Math.floor(timeLeftMs / (1000 * 60 * 60));
            const minutes = Math.ceil((timeLeftMs % (1000 * 60 * 60)) / (1000 * 60));
            
            let timeMessage = "";
            if (hours > 0) {
              timeMessage = `${hours} hora${hours !== 1 ? 's' : ''}`;
              if (minutes > 0) {
                timeMessage += ` y ${minutes} minuto${minutes !== 1 ? 's' : ''}`;
              }
            } else {
              timeMessage = `${minutes} minuto${minutes !== 1 ? 's' : ''}`;
            }
            
            return res.status(401).json({ 
              message: `Cuenta Suspendida (${timeMessage})`
            });
          }
        } else {
          return res.status(401).json({ message: "Cuenta Suspendida" });
        }
      }

      if (updatedUser.status === 'bloqueado') {
        return res.status(401).json({ message: "Cuenta Bloqueada" });
      }

      if (!updatedUser.activo) {
        return res.status(401).json({ message: "Usuario inactivo" });
      }

      const isValidPassword = await bcrypt.compare(password, updatedUser.password);
      if (!isValidPassword) {
        // Increment failed attempts
        await storage.incrementFailedAttempts(username);
        
        // Check if user should be suspended
        const wasSuspended = await storage.checkAndSuspendUser(username);
        if (wasSuspended) {
          // Notify admins about the suspension
          await storage.notifyAdminsOfFailedLoginSuspension(username, clientIp);
          return res.status(401).json({ 
            message: "Cuenta Suspendida (3 horas)"
          });
        }
        
        return res.status(401).json({ message: "Credenciales inválidas" });
      }

      // Check if user already has an active session
      const hasActiveSession = await storage.isSessionActive(updatedUser.id);
      if (hasActiveSession) {
        return res.status(401).json({ 
          message: "Ya tienes una sesión activa. Cierra la sesión actual antes de iniciar una nueva."
        });
      }

      // Reset failed attempts on successful login
      await storage.resetFailedAttempts(username);

      // Actualizar último acceso y dirección IP
      await storage.updateUserLastAccess(updatedUser.id, clientIp);

      const token = jwt.sign(
        { id: updatedUser.id, username: updatedUser.username, rol: updatedUser.rol },
        JWT_SECRET,
        { expiresIn: "24h" }
      );

      // Set session token and expiration (24 hours)
      const sessionExpires = new Date();
      sessionExpires.setHours(sessionExpires.getHours() + 24);
      await storage.setUserSession(updatedUser.id, token, sessionExpires);

      res.json({
        token,
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          nombre: updatedUser.nombre,
          email: updatedUser.email,
          rol: updatedUser.rol,
        },
      });
    } catch (error) {
      // Login error - handle gracefully
      res.status(400).json({ message: "Error en el login" });
    }
  });

  app.post("/api/auth/logout", authenticateToken, async (req: any, res) => {
    try {
      const user = req.user;
      // Clear the user's session
      await storage.clearUserSession(user.id);
      res.json({ message: "Sesión cerrada exitosamente" });
    } catch (error) {
      // Logout error - handle gracefully
      res.status(500).json({ message: "Error al cerrar sesión" });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req: any, res) => {
    const user = req.user;
    res.json({
      id: user.id,
      username: user.username,
      nombre: user.nombre,
      email: user.email,
      rol: user.rol,
    });
  });

  // Dashboard Routes - role-based
  app.get("/api/dashboard/stats", authenticateToken, async (req: any, res) => {
    try {
      const userRole = req.user.rol;
      
      // For regular users, show data by their coordination
      let stats;
      if (userRole === "usuario") {
        stats = await storage.getDashboardStatsByUser(req.user.id);
      } else {
        // Admins and supervisors can see all data
        stats = await storage.getDashboardStats();
      }
      
      res.json(stats);
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      res.status(500).json({ message: "Error obteniendo estadísticas" });
    }
  });

  // Solicitudes Routes - role-based
  app.get("/api/solicitudes", authenticateToken, async (req: any, res) => {
    try {
      const filters = {
        operador: req.query.operador as string,
        estado: req.query.estado as string,
        tipoExperticia: req.query.tipoExperticia as string,
        coordinacion: req.query.coordinacion as string,
        search: req.query.search as string,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
      };

        // For regular users, filter by their coordination
      if (req.user.rol === "usuario") {
        // Users can only see requests from their coordination
        if (!req.user.coordinacion) {
        return res.status(403).json({ message: "Usuario sin coordinación asignada" });
      }
  
          // Add coordination filter to existing filters
          const coordinacionFilters = { 
          ...filters, 
          coordinacionSolicitante: req.user.coordinacion 
        };
        const result = await storage.getSolicitudes(coordinacionFilters);
        res.json(result);
      } else {
        // Admins and supervisors can see all requests with optional coordination filter
        const adminFilters: any = { ...filters };
        if (adminFilters.coordinacion && adminFilters.coordinacion !== "todos") {
          adminFilters.coordinacionSolicitante = adminFilters.coordinacion;
        }
        delete adminFilters.coordinacion; // Remove coordinacion from filters, use coordinacionSolicitante instead
        
        const result = await storage.getSolicitudes(adminFilters);
        res.json(result);
      }
    } catch (error) {
      // Error getting requests - handle gracefully  
      res.status(500).json({ message: "Error obteniendo solicitudes" });
    }
  });

  app.get("/api/solicitudes/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const solicitud = await storage.getSolicitudById(id);
      
      if (!solicitud) {
        return res.status(404).json({ message: "Solicitud no encontrada" });
      }

      res.json(solicitud);
    } catch (error) {
      // Error getting request by ID - handle gracefully
      res.status(500).json({ message: "Error obteniendo solicitud" });
    }
  });

  app.post("/api/solicitudes", authenticateToken, async (req: any, res) => {
    try {
      // Input validation
      if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({ message: "Datos de solicitud requeridos" });
      }

      // Role-based validation: supervisor and usuario can only create requests with "enviada" status
      if ((req.user.rol === "supervisor" || req.user.rol === "usuario") && req.body.estado && req.body.estado !== "enviada") {
        return res.status(403).json({ 
          message: "Los usuarios con rol supervisor y usuario solo pueden crear solicitudes con estado 'enviada'" 
        });
      }

      // Force estado to "enviada" for supervisor and usuario roles
      const requestData = { ...req.body };
      if (req.user.rol === "supervisor" || req.user.rol === "usuario") {
        requestData.estado = "enviada";
      }

      const solicitudData = insertSolicitudSchema.parse({
        ...requestData,
        usuarioId: req.user.id,
      });

      // Input sanitization is now handled by Zod schema transforms

      // Verificar que el número de solicitud no exista
      const existingSolicitud = await storage.getSolicitudByNumero(solicitudData.numeroSolicitud);
      if (existingSolicitud) {
        return res.status(400).json({ 
          message: "El número de solicitud ya existe. Por favor, ingrese un número único." 
        });
      }

      const solicitud = await storage.createSolicitud(solicitudData);
      
      // Crear historial y notificaciones en paralelo
      const promises = [
        storage.createHistorial({
          solicitudId: solicitud.id,
          accion: "creada",
          descripcion: "Solicitud creada",
          usuarioId: req.user.id,
        })
      ];

      // Si la solicitud se crea con estado "enviada", notificar a los administradores
      if (solicitud.estado === "enviada") {
        promises.push(
          storage.notifyAdminsOfSentRequest(solicitud.id, solicitud.numeroSolicitud).then(() => ({
            id: 0,
            createdAt: null,
            usuarioId: null,
            descripcion: null,
            solicitudId: null,
            accion: "notification_sent"
          }))
        );
      }

      await Promise.all(promises);

      // Generar documentos automáticamente después de crear la solicitud
      try {
        // Preparar datos para generación de documentos
        const documentData = {
          ...solicitudData,
          // Incluir datos parseados si existen en el body original
          informacionE: requestData.informacionE || '',
          informacionR: requestData.informacionR || '',
          desde: requestData.desde || '',
          hasta: requestData.hasta || ''
        };
        
        // Intentar generar documento Word y Excel en paralelo
        const [wordBuffer, excelBuffer] = await Promise.all([
          generateWordDocument(documentData, storage),
          generateExcelDocument(documentData)
        ]);
              
      } catch (docError) {
        console.error("Error en generación automática de documentos:", docError);
        // No fallar la creación de solicitud si los documentos no se pueden generar
      }

      res.status(201).json(solicitud);
    } catch (error) {
      // Error creating request - handle validation and database errors
      if (error instanceof z.ZodError) {
        const validationErrors = error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }));
        return res.status(400).json({ 
          message: "Datos inválidos", 
          errors: validationErrors
        });
      }
      
      // Check for duplicate key error
      if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
        return res.status(400).json({ message: "Número de Solicitud Duplicada" });
      }
      
      res.status(500).json({ message: "Error creando solicitud" });
    }
  });

  app.put("/api/solicitudes/:id", authenticateToken, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Get current solicitud to check its status
      const currentSolicitud = await storage.getSolicitudById(id);
      if (!currentSolicitud) {
        return res.status(404).json({ message: "Solicitud no encontrada" });
      }

      // Only admins can edit requests that are not in "enviada" status
      if (currentSolicitud.estado !== "enviada" && req.user.rol !== "admin") {
        return res.status(403).json({ 
          message: "Solo los administradores pueden editar solicitudes con estado diferente a 'enviada'" 
        });
      }
      
      // Role-based validation: supervisor and usuario can only update to "enviada" status
      if ((req.user.rol === "supervisor" || req.user.rol === "usuario") && req.body.estado && req.body.estado !== "enviada") {
        return res.status(403).json({ 
          message: "Los usuarios con rol supervisor y usuario solo pueden establecer el estado como 'enviada'" 
        });
      }

      // Force estado to "enviada" for supervisor and usuario roles if they're trying to change it
      const requestData = { ...req.body };
      if ((req.user.rol === "supervisor" || req.user.rol === "usuario") && requestData.estado) {
        requestData.estado = "enviada";
      }

      const solicitudData = insertSolicitudSchema.partial().parse(requestData);

      // Verificar que el número de solicitud no exista (si se está actualizando)
      if (solicitudData.numeroSolicitud) {
        const existingSolicitud = await storage.getSolicitudByNumero(solicitudData.numeroSolicitud);
        if (existingSolicitud && existingSolicitud.id !== id) {
          return res.status(400).json({ 
            message: "El número de solicitud ya existe. Por favor, ingrese un número único." 
          });
        }
      }

      const solicitud = await storage.updateSolicitud(id, solicitudData);
      
      if (!solicitud) {
        return res.status(404).json({ message: "Solicitud no encontrada" });
      }

      // Create notification when status changes
      if (solicitudData.estado && solicitudData.estado !== currentSolicitud.estado) {
        const statusNames = {
          procesando: "Procesando",
          enviada: "Enviada",
          respondida: "Respondida",
          rechazada: "Rechazada"
        };
        
        let mensaje = `Solicitud ${solicitud.numeroSolicitud} cambió a estado: ${statusNames[solicitudData.estado as keyof typeof statusNames]}`;
        
        // If rejected, include rejection reason
        if (solicitudData.estado === "rechazada" && solicitudData.motivoRechazo) {
          mensaje += ` - Motivo: ${solicitudData.motivoRechazo}`;
        }
        
        // Notify the user who created the request
        if (solicitud.usuarioId) {
          await storage.createNotificacion(solicitud.usuarioId, solicitud.id, mensaje);
        }

        // If status changed to "enviada", notify admins
        if (solicitudData.estado === "enviada") {
          await storage.notifyAdminsOfSentRequest(solicitud.id, solicitud.numeroSolicitud);
        }
      }

      // Crear historial
      await storage.createHistorial({
        solicitudId: solicitud.id,
        accion: "actualizada",
        descripcion: "Solicitud actualizada",
        usuarioId: req.user.id,
      });

      res.json(solicitud);
    } catch (error) {
      // Error actualizando solicitud:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Datos inválidos", errors: error.errors });
      }
      
      // Check for duplicate key error
      if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
        return res.status(400).json({ message: "Número de Solicitud Duplicada" });
      }
      
      res.status(500).json({ message: "Error actualizando solicitud" });
    }
  });

  app.delete("/api/solicitudes/:id", authenticateToken, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Get current solicitud to check its status
      const currentSolicitud = await storage.getSolicitudById(id);
      if (!currentSolicitud) {
        return res.status(404).json({ message: "Solicitud no encontrada" });
      }

      // Only admins can delete requests that are not in "enviada" status
      if (currentSolicitud.estado !== "enviada" && req.user.rol !== "admin") {
        return res.status(403).json({ 
          message: "Solo los administradores pueden eliminar solicitudes con estado diferente a 'enviada'" 
        });
      }
      
      const deleted = await storage.deleteSolicitud(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Solicitud no encontrada" });
      }

      res.json({ message: "Solicitud eliminada exitosamente" });
    } catch (error) {
      // Error eliminando solicitud:", error);
      res.status(500).json({ message: "Error eliminando solicitud" });
    }
  });

  // Plantillas Routes
  app.get("/api/plantillas", authenticateToken, async (req: any, res) => {
    try {
      const plantillas = await storage.getPlantillasCorreo(req.user.id);
      res.json(plantillas);
    } catch (error) {
      // Error obteniendo plantillas:", error);
      res.status(500).json({ message: "Error obteniendo plantillas" });
    }
  });

  app.post("/api/plantillas", authenticateToken, async (req: any, res) => {
    try {
      const plantillaData = insertPlantillaCorreoSchema.parse({
        ...req.body,
        usuarioId: req.user.id,
      });

      const plantilla = await storage.createPlantillaCorreo(plantillaData);
      res.status(201).json(plantilla);
    } catch (error) {
      // Error creando plantilla:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Datos inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Error creando plantilla" });
    }
  });

  app.put("/api/plantillas/:id", authenticateToken, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const plantillaData = insertPlantillaCorreoSchema.partial().parse(req.body);

      const plantilla = await storage.updatePlantillaCorreo(id, plantillaData);
      
      if (!plantilla) {
        return res.status(404).json({ message: "Plantilla no encontrada" });
      }

      res.json(plantilla);
    } catch (error) {
      // Error actualizando plantilla:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Datos inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Error actualizando plantilla" });
    }
  });

  app.delete("/api/plantillas/:id", authenticateToken, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deletePlantillaCorreo(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Plantilla no encontrada" });
      }

      res.json({ message: "Plantilla eliminada exitosamente" });
    } catch (error) {
      // Error eliminando plantilla:", error);
      res.status(500).json({ message: "Error eliminando plantilla" });
    }
  });

  // Users Routes (Admin only)
  const requireAdmin = (req: any, res: any, next: any) => {
    if (req.user?.rol !== 'admin') {
      return res.status(403).json({ message: 'Acceso denegado. Se requieren permisos de administrador.' });
    }
    next();
  };

  const requireAdminOrSupervisor = (req: any, res: any, next: any) => {
    if (req.user?.rol !== 'admin' && req.user?.rol !== 'supervisor') {
      return res.status(403).json({ message: 'Acceso denegado. Se requieren permisos de administrador o supervisor.' });
    }
    next();
  };

  app.get("/api/users", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const filters = {
        search: req.query.search as string,
        status: req.query.status as string,
        rol: req.query.rol as string,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
      };

      const result = await storage.getUsers(filters);
      res.json(result);
    } catch (error) {
      // Error obteniendo usuarios:", error);
      res.status(500).json({ message: "Error obteniendo usuarios" });
    }
  });

  app.post("/api/users", authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      // Transform date fields from string to Date if provided
      const bodyData = { ...req.body };
      
      // Clean up and transform date fields
      if (bodyData.tiempoSuspension && bodyData.tiempoSuspension !== '' && bodyData.tiempoSuspension !== null) {
        bodyData.tiempoSuspension = new Date(bodyData.tiempoSuspension);
      } else {
        delete bodyData.tiempoSuspension;
      }
      
      if (bodyData.fechaSuspension && bodyData.fechaSuspension !== '' && bodyData.fechaSuspension !== null) {
        bodyData.fechaSuspension = new Date(bodyData.fechaSuspension);
      } else {
        delete bodyData.fechaSuspension;
      }

      const userData = insertUserSchema.parse(bodyData);
      
      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const userDataWithHashedPassword = {
        ...userData,
        password: hashedPassword,
        // Auto-assign IP address if not provided
        direccionIp: userData.direccionIp || (req as any).clientIp || 'unknown',
      };

      const user = await storage.createUser(userDataWithHashedPassword);
      
      // Remove password from response
      const { password, ...userResponse } = user;
      res.status(201).json(userResponse);
    } catch (error) {
      // Error creando usuario:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Datos inválidos", errors: error.errors });
      }
      if ((error as any).code === '23505') { // unique constraint violation
        return res.status(400).json({ message: "El nombre de usuario ya existe" });
      }
      res.status(500).json({ message: "Error creando usuario" });
    }
  });

  app.patch("/api/users/:id", authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Transform date fields from string to Date if provided
      const bodyData = { ...req.body };
      
      // Clean up and transform date fields
      if (bodyData.tiempoSuspension && bodyData.tiempoSuspension !== '' && bodyData.tiempoSuspension !== null) {
        bodyData.tiempoSuspension = new Date(bodyData.tiempoSuspension);
      } else {
        delete bodyData.tiempoSuspension;
      }
      
      if (bodyData.fechaSuspension && bodyData.fechaSuspension !== '' && bodyData.fechaSuspension !== null) {
        bodyData.fechaSuspension = new Date(bodyData.fechaSuspension);
      } else {
        delete bodyData.fechaSuspension;
      }

      const userData = insertUserSchema.partial().parse(bodyData);

      // If password is provided, hash it
      if (userData.password) {
        userData.password = await bcrypt.hash(userData.password, 10);
      }

      // Auto-assign IP address if not provided but is being updated
      if (userData.direccionIp === '' || userData.direccionIp === undefined) {
        userData.direccionIp = (req as any).clientIp || 'unknown';
      }

      const user = await storage.updateUser(id, userData);
      
      if (!user) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }

      // Remove password from response
      const { password, ...userResponse } = user;
      res.json(userResponse);
    } catch (error) {
      // Error actualizando usuario:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Datos inválidos", errors: error.errors });
      }
      if ((error as any).code === '23505') { // unique constraint violation
        return res.status(400).json({ message: "El nombre de usuario ya existe" });
      }
      res.status(500).json({ message: "Error actualizando usuario" });
    }
  });

  app.delete("/api/users/:id", authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Prevent deleting self
      if (id === req.user.id) {
        return res.status(400).json({ message: "No puedes eliminar tu propia cuenta" });
      }

      const deleted = await storage.deleteUser(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }

      res.json({ message: "Usuario eliminado exitosamente" });
    } catch (error) {
      // Error eliminando usuario:", error);
      res.status(500).json({ message: "Error eliminando usuario" });
    }
  });

  // Historial Routes
  app.get("/api/solicitudes/:id/historial", authenticateToken, async (req, res) => {
    try {
      const solicitudId = parseInt(req.params.id);
      const historial = await storage.getHistorialBySolicitud(solicitudId);
      res.json(historial);
    } catch (error) {
      // Error obteniendo historial:", error);
      res.status(500).json({ message: "Error obteniendo historial" });
    }
  });

  // Notifications routes
  app.get("/api/notifications", authenticateToken, async (req: any, res) => {
    try {
      const notifications = await storage.getNotificacionesByUser(req.user.id);
      res.json(notifications);
    } catch (error) {
      // Error obteniendo notificaciones:", error);
      res.status(500).json({ message: "Error obteniendo notificaciones" });
    }
  });

  app.put("/api/notifications/:id/read", authenticateToken, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.markNotificacionAsRead(id);
      res.json({ message: "Notificación marcada como leída" });
    } catch (error) {
      // Error marcando notificación como leída:", error);
      res.status(500).json({ message: "Error marcando notificación como leída" });
    }
  });

  app.get("/api/notifications/unread-count", authenticateToken, async (req: any, res) => {
    try {
      const count = await storage.getUnreadNotificationsCount(req.user.id);
      res.json({ count });
    } catch (error) {
      // Error obteniendo conteo de notificaciones:", error);
      res.status(500).json({ message: "Error obteniendo conteo de notificaciones" });
    }
  });

  // Guide PDF Generation Route
  app.get("/api/guide/pdf", authenticateToken, async (req: any, res) => {
    try {
      const guideContent = generateUserGuideHTML();
      
      // Set response headers for PDF download
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Content-Disposition', 'inline; filename="guia-usuario-ter-system.html"');
      
      res.send(guideContent);
    } catch (error) {
      // Error generando guía:", error);
      res.status(500).json({ message: "Error generando guía de usuario" });
    }
  });

  // Plantillas Word Routes
  app.get("/api/plantillas-word", authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const tipoExperticia = req.query.tipoExperticia as string;
      const plantillas = await storage.getPlantillasWord(tipoExperticia);
      res.json(plantillas);
    } catch (error) {
      // Error obteniendo plantillas Word:", error);
      res.status(500).json({ message: "Error obteniendo plantillas Word" });
    }
  });

  app.post("/api/plantillas-word", authenticateToken, requireAdmin, upload.single('archivo'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No se proporcionó archivo" });
      }

      const { nombre, tipoExperticia, tipoPlantilla } = req.body;
      
      // Validate request body
      if (!nombre || !tipoExperticia || !tipoPlantilla) {
        return res.status(400).json({ message: "Nombre, tipo de experticia y tipo de plantilla son requeridos" });
      }

      // Check if a template already exists for this combination of expertise type and template type
      const existingTemplate = await storage.getPlantillaWordByTipoExperticiaTipoPlantilla(tipoExperticia, tipoPlantilla);
      if (existingTemplate) {
        return res.status(400).json({ message: `Ya existe una plantilla de tipo ${tipoPlantilla} para este tipo de experticia` });
      }

      // Generate unique filename
      const fileExtension = path.extname(req.file.originalname);
      const fileName = `plantilla-${tipoExperticia}-${Date.now()}${fileExtension}`;
      const filePath = path.join(uploadsDir, fileName);

      // Save file to disk
      writeFileSync(filePath, req.file.buffer);

      // Create template record
      const plantillaData = {
        nombre,
        tipoExperticia,
        tipoPlantilla,
        archivo: filePath,
        nombreArchivo: req.file.originalname,
        tamaño: req.file.size,
        usuarioId: req.user.id,
      };

      const plantilla = await storage.createPlantillaWord(plantillaData);
      res.json(plantilla);
    } catch (error) {
      // Error creando plantilla Word:", error);
      res.status(500).json({ message: "Error creando plantilla Word" });
    }
  });

  app.get("/api/plantillas-word/:id", authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const plantilla = await storage.getPlantillaWordById(id);
      
      if (!plantilla) {
        return res.status(404).json({ message: "Plantilla no encontrada" });
      }

      res.json(plantilla);
    } catch (error) {
      // Error obteniendo plantilla Word:", error);
      res.status(500).json({ message: "Error obteniendo plantilla Word" });
    }
  });

  // Codigo de Generacion de Planilla
  //Descargar Plantilla Original por ID 
 
  app.post("/api/config/download-format", authenticateToken, requireAdmin, async (req: any, res) => {
    // Aquí puedes actualizar la variable o el objeto
    const { downloadAsPdf } = req.body;
      
    // O actualizar objeto de configuración
    swiPdf.downloadAsPdf = downloadAsPdf;
});

  app.get("/api/plantillas-word/:id/download", authenticateToken, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const plantilla = await storage.getPlantillaWordById(id);
      
      if (!plantilla) {
        return res.status(404).json({ message: "Plantilla no encontrada" });
      }

      // Check if file exists
      if (!existsSync(plantilla.archivo)) {
        return res.status(404).json({ message: "Archivo no encontrado" });
      }

      // Read file and send it
      const fileBuffer = readFileSync(plantilla.archivo);
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="${plantilla.nombreArchivo}"`);
      res.send(fileBuffer);
    } catch (error) {
      // Error descargando plantilla Word:", error);
      res.status(500).json({ message: "Error descargando plantilla Word" });
    }
  });

  app.delete("/api/plantillas-word/:id", authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const plantilla = await storage.getPlantillaWordById(id);
      
      if (!plantilla) {
        return res.status(404).json({ message: "Plantilla no encontrada" });
      }

      // Delete file from disk
      if (existsSync(plantilla.archivo)) {
        unlinkSync(plantilla.archivo);
      }

      // Delete record from database
      const deleted = await storage.deletePlantillaWord(id);
      
      if (deleted) {
        res.json({ message: "Plantilla eliminada exitosamente" });
      } else {
        res.status(500).json({ message: "Error eliminando plantilla" });
      }
    } catch (error) {
      // Error eliminando plantilla Word:", error);
      res.status(500).json({ message: "Error eliminando plantilla Word" });
    }
  });

  // Ruta para obtener plantilla por tipo de experiencia (para descarga automática)
  app.get("/api/plantillas-word/by-expertise/:tipoExperticia", authenticateToken, async (req: any, res) => {
    try {
      const tipoExperticia = req.params.tipoExperticia;
      const plantilla = await storage.getPlantillaWordByTipoExperticia(tipoExperticia);
      
      if (!plantilla) {
        return res.status(404).json({ message: "No hay plantilla disponible para este tipo de experticia" });
      }

      // Check if file exists
      if (!existsSync(plantilla.archivo)) {
        return res.status(404).json({ message: "Archivo no encontrado" });
      }

      // Read file and send it
      const fileBuffer = readFileSync(plantilla.archivo);
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="${plantilla.nombreArchivo}"`);
      res.send(fileBuffer);
    } catch (error) {
      // Error descargando plantilla por experticia:", error);
      res.status(500).json({ message: "Error descargando plantilla" });
    }
  });

app.post("/api/plantillas-word/by-expertise/:tipoExperticia/generate", authenticateToken, async (req: any, res) => {
  try {
    const { tipoExperticia } = req.params;
    const requestData = req.body;


    // 1. Validar existencia de plantilla y archivo (más conciso)
    const plantilla = await storage.getPlantillaWordByTipoExperticia(tipoExperticia);
    if (!plantilla) {
      return res.status(404).json({ message: "No hay plantilla disponible para este tipo de experticia" });
    }
    if (!existsSync(plantilla.archivo)) {
      return res.status(404).json({ message: "Archivo de plantilla no encontrado" });
    }
    // 2. Preparar datos para la plantilla
    const currentDate = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' });
    const solicitudShort = requestData.numeroSolicitud?.split('-').pop() || requestData.numeroSolicitud || ''; // Uso de optional chaining y nullish coalescing

    // Extraer prefijos de informacionLinea
    const abonado = parseWithPrefixes(requestData.informacionLinea || '', ['e', 'r']);
    const fecha = parseWithPrefixes(requestData.fecha_de_solicitud || '', ['desde', 'hasta']);

      console.log('=== GENERACIÓN PLANILLA WORD ===');
      console.log('Tipo de Experticia:', tipoExperticia);
      console.log('¿Es Contacto Frecuente?:', tipoExperticia === 'determinar_contacto_frecuente');
      console.log('Datos recibidos del frontend (requestData):');
      console.log('  - informacionLinea (sin parsear):', requestData.informacionLinea);
      console.log('  - informacionE (parseado):', abonado .e);
      console.log('  - informacionR (parseado):', abonado .r);
      console.log('  - fecha (sin parsear):', requestData.fecha);
      console.log('  - desde (parseado):', fecha.desde);
      console.log('  - hasta (parseado):', fecha.hasta);
      


    const templateData = {
      // Uso de un único estilo de nombre para los placeholders
      OFI: (requestData.coordinacionSolicitante.includes('delitos_propiedad')) 
         ? 'CIDCPROP' 

         : (requestData.coordinacionSolicitante.includes('delitos_personas')) 
         ? 'CIDCPER' 
          
         : (requestData.coordinacionSolicitante.includes('crimen_organizado')) 
         ? 'COLOCAR IDENTIFICADOR'

         : (requestData.coordinacionSolicitante.includes('delitos_vehiculos')) 
         ? 'CIRHV'
        
         : (requestData.coordinacionSolicitante.includes('homicidio')) 
         ? 'CIDCPER'

         : 'IDENTIFICAR OFICINA POR FAVOR!!!',  // Valor por defecto,

      SOLICITUD: solicitudShort,
      EXP: requestData.numeroExpediente || '',
      OPER: (requestData.operador || '').toUpperCase(),
      FECHA: currentDate,
      FISCAL: requestData.fiscal || '',
      DIR: requestData.direc || '',
      INFO_E: abonado .e || requestData.informacionE || '',
      INFO_R: abonado .r || requestData.informacionR || '',
      DESDE: fecha.desde || '', // iNTRODUCIR
      HASTA: fecha.hasta || '',      // INTRODUCIR
      DELITO: requestData.delito || '',
      
      /*
      informacionLinea: requestData.informacionLinea || '',
      descripcion: requestData.descripcion || '', */
    };

    console.log('Datos preparados para la plantilla Word (templateData):');
    console.log('  - INFO_E:', templateData.INFO_E);
    console.log('  - INFO_R:', templateData.INFO_R);
    console.log('  - DESDE:', templateData.DESDE);
    console.log('  - HASTA:', templateData.HASTA);
    console.log('Template Data completo:', JSON.stringify(templateData, null, 2));

    let busArhivo: Buffer; // Variable para almacenar el buffer del archivo a enviar
    
    // Colocar Condicional Aquí
    if (swiPdf.downloadAsPdf) { // Suponiendo que 'esPDF' es una propiedad en requestData que indica si es PDF
      
      // Aquí podrías agregar la lógica para generar un PDF si fuera necesario,
      // o simplemente terminar la ejecución si solo se espera imprimir "PDF"
      return res.status(200).json({ message: "Se solicitó la generación de PDF." });
    } else {
      try {
        // Leer el archivo de la plantilla
        const content = readFileSync(plantilla.archivo, 'binary');
        const zip = new PizZip(content);
        const doc = new Docxtemplater(zip, {
          paragraphLoop: true,
          linebreaks: true,
        });

        console.log('Iniciando renderizado del documento Word con docxtemplater...');
        
        // Generar Documento con Datos
        doc.render(templateData);

        // Obtener el buffer del documento generado con los datos
        busArhivo = doc.getZip().generate({ type: 'nodebuffer' });
        
        console.log('Documento Word generado exitosamente');

      } catch (renderError: any) {
        // Si el renderizado falla, registramos el error y usamos la plantilla original
        console.error("Error al renderizar la plantilla con docxtemplater:", renderError);
        busArhivo = readFileSync(plantilla.archivo); // Usar la plantilla original
      }
      // 3. Configurar y enviar la respuesta (consolidado) (Nombre)
      const customFileName = `${plantilla.nombre}-${requestData.numeroSolicitud || 'plantilla'}.docx`;
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="${customFileName}"`);
      res.send(busArhivo);
    }

  } catch (error) {
    // Manejo de errores generales (ej. problemas de base de datos o acceso a archivos antes del renderizado)
    res.status(500).json({ message: "Error generando plantilla personalizada" });
  }
});// Final de word

  
  // Registrar rutas de gestión de documentos (Word y Excel)
  registerDocumentRoutes(app, authenticateToken, storage);

  // Registrar rutas del chatbot AI
  registerChatbotRoutes(app, authenticateToken, requireAdmin, storage);

  // Registrar rutas de estadísticas
  registerStatsRoutes(app, authenticateToken);

  // ============================================
  // ANÁLISIS DE TRAZABILIDAD - API Routes
  // ============================================

  // Personas Casos - CRUD
  app.get("/api/personas-casos", authenticateToken, async (req: any, res) => {
    try {
      const { search, page, limit } = req.query;
      const result = await storage.getPersonasCasos({
        search: search as string,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });
      res.json(result);
    } catch (error: any) {
      console.error('Error getting personas casos:', error);
      res.status(500).json({ message: 'Error al obtener personas casos' });
    }
  });

  app.get("/api/personas-casos/:nro", authenticateToken, async (req: any, res) => {
    try {
      const nro = parseInt(req.params.nro);
      const persona = await storage.getPersonaCasoById(nro);
      if (!persona) {
        return res.status(404).json({ message: 'Persona caso no encontrada' });
      }
      res.json(persona);
    } catch (error: any) {
      console.error('Error getting persona caso:', error);
      res.status(500).json({ message: 'Error al obtener persona caso' });
    }
  });

  // Persona Teléfonos - Catálogo de números
  app.get("/api/persona-telefonos/persona/:personaId", authenticateToken, async (req: any, res) => {
    try {
      const personaId = parseInt(req.params.personaId);
      const telefonos = await storage.getPersonaTelefonos(personaId);
      res.json(telefonos);
    } catch (error: any) {
      console.error('Error getting persona telefonos:', error);
      res.status(500).json({ message: 'Error al obtener teléfonos' });
    }
  });

  app.get("/api/persona-telefonos/:id", authenticateToken, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const telefono = await storage.getPersonaTelefonoById(id);
      if (!telefono) {
        return res.status(404).json({ message: 'Teléfono no encontrado' });
      }
      res.json(telefono);
    } catch (error: any) {
      console.error('Error getting telefono:', error);
      res.status(500).json({ message: 'Error al obtener teléfono' });
    }
  });

  app.get("/api/persona-telefonos/numero/:numero", authenticateToken, async (req: any, res) => {
    try {
      const { numero } = req.params;
      const telefono = await storage.getPersonaTelefonoByNumero(numero);
      if (!telefono) {
        return res.status(404).json({ message: 'Teléfono no encontrado' });
      }
      res.json(telefono);
    } catch (error: any) {
      console.error('Error getting telefono by numero:', error);
      res.status(500).json({ message: 'Error al obtener teléfono' });
    }
  });

  app.post("/api/persona-telefonos", authenticateToken, async (req: any, res) => {
    try {
      const validatedData = insertPersonaTelefonoSchema.parse(req.body);
      const newTelefono = await storage.createPersonaTelefono(validatedData);
      res.status(201).json(newTelefono);
    } catch (error: any) {
      console.error('Error creating telefono:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: 'Datos inválidos', errors: error.errors });
      }
      res.status(500).json({ message: 'Error al crear teléfono' });
    }
  });

  app.post("/api/persona-telefonos/bulk", authenticateToken, async (req: any, res) => {
    try {
      const { telefonos } = req.body;
      if (!Array.isArray(telefonos)) {
        return res.status(400).json({ message: 'Se esperaba un array de teléfonos' });
      }
      const validatedData = telefonos.map(t => insertPersonaTelefonoSchema.parse(t));
      const newTelefonos = await storage.createPersonaTelefonosBulk(validatedData);
      res.status(201).json({
        message: `${newTelefonos.length} teléfonos creados correctamente`,
        telefonos: newTelefonos
      });
    } catch (error: any) {
      console.error('Error creating bulk telefonos:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: 'Datos inválidos', errors: error.errors });
      }
      res.status(500).json({ message: 'Error al crear teléfonos' });
    }
  });

  app.put("/api/persona-telefonos/:id", authenticateToken, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertPersonaTelefonoSchema.partial().parse(req.body);
      const updated = await storage.updatePersonaTelefono(id, validatedData);
      if (!updated) {
        return res.status(404).json({ message: 'Teléfono no encontrado' });
      }
      res.json(updated);
    } catch (error: any) {
      console.error('Error updating telefono:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: 'Datos inválidos', errors: error.errors });
      }
      res.status(500).json({ message: 'Error al actualizar teléfono' });
    }
  });

  app.delete("/api/persona-telefonos/:id", authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deletePersonaTelefono(id);
      if (!deleted) {
        return res.status(404).json({ message: 'Teléfono no encontrado' });
      }
      res.json({ message: 'Teléfono eliminado correctamente' });
    } catch (error: any) {
      console.error('Error deleting telefono:', error);
      res.status(500).json({ message: 'Error al eliminar teléfono' });
    }
  });

  app.post("/api/personas-casos", authenticateToken, async (req: any, res) => {
    try {
      const validatedData = insertPersonaCasoSchema.parse({
        ...req.body,
        usuarioId: req.user.id,
      });
      const newPersona = await storage.createPersonaCaso(validatedData);
      res.status(201).json(newPersona);
    } catch (error: any) {
      console.error('Error creating persona caso:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: 'Datos inválidos', errors: error.errors });
      }
      res.status(500).json({ message: 'Error al crear persona caso' });
    }
  });

  app.put("/api/personas-casos/:nro", authenticateToken, async (req: any, res) => {
    try {
      const nro = parseInt(req.params.nro);
      console.log('[DEBUG PUT] Datos recibidos del frontend:', JSON.stringify(req.body));
      const validatedData = insertPersonaCasoSchema.partial().parse(req.body);
      console.log('[DEBUG PUT] Datos después de validación Zod:', JSON.stringify(validatedData));
      const updated = await storage.updatePersonaCaso(nro, validatedData);
      console.log('[DEBUG PUT] Datos devueltos por DB:', JSON.stringify(updated));
      if (!updated) {
        return res.status(404).json({ message: 'Persona caso no encontrada' });
      }
      res.json(updated);
    } catch (error: any) {
      console.error('Error updating persona caso:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: 'Datos inválidos', errors: error.errors });
      }
      res.status(500).json({ message: 'Error al actualizar persona caso' });
    }
  });

  app.delete("/api/personas-casos/:nro", authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const nro = parseInt(req.params.nro);
      const deleted = await storage.deletePersonaCaso(nro);
      if (!deleted) {
        return res.status(404).json({ message: 'Persona caso no encontrada' });
      }
      res.json({ message: 'Persona caso eliminada correctamente' });
    } catch (error: any) {
      console.error('Error deleting persona caso:', error);
      res.status(500).json({ message: 'Error al eliminar persona caso' });
    }
  });

  // Endpoint para obtener persona/caso completo por ID
  app.get("/api/personas-casos/:id", authenticateToken, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const persona = await storage.getPersonaCasoById(id);
      if (!persona) {
        return res.status(404).json({ message: 'Persona/caso no encontrado' });
      }
      
      // Obtener todos los números asociados a esta persona
      const telefonos = await db.select()
        .from(personaTelefonos)
        .where(eq(personaTelefonos.personaId, id));
      
      res.json({
        ...persona,
        telefonosAsociados: telefonos
      });
    } catch (error: any) {
      console.error('Error getting persona caso:', error);
      res.status(500).json({ message: 'Error al obtener persona/caso' });
    }
  });

  // Endpoint de búsqueda general para trazabilidad
  app.get("/api/trazabilidad/buscar", authenticateToken, async (req: any, res) => {
    try {
      const { tipo, valor } = req.query;
      
      if (!tipo || !valor) {
        return res.status(400).json({ message: 'Se requieren los parámetros tipo y valor' });
      }

      let resultados: any[] = [];
      
      // Búsqueda según el tipo
      switch (tipo) {
        case 'cedula':
          const personaPorCedula = await db.select()
            .from(personasCasos)
            .where(eq(personasCasos.cedula, valor as string));
          resultados = personaPorCedula.map(p => ({
            id: p.nro,
            expediente: p.expediente,
            cedula: p.cedula,
            nombreCompleto: `${p.nombre} ${p.apellido}`,
            numeroAsociado: p.telefono,
            delito: p.delito,
            fechaInicio: p.fechaDeInicio
          }));
          break;
          
        case 'nombre':
          const personasPorNombre = await db.select()
            .from(personasCasos)
            .where(sql`LOWER(${personasCasos.nombre}) LIKE LOWER(${'%' + valor + '%'}) OR LOWER(${personasCasos.apellido}) LIKE LOWER(${'%' + valor + '%'})`);
          resultados = personasPorNombre.map(p => ({
            id: p.nro,
            expediente: p.expediente,
            cedula: p.cedula,
            nombreCompleto: `${p.nombre} ${p.apellido}`,
            numeroAsociado: p.telefono,
            delito: p.delito,
            fechaInicio: p.fechaDeInicio
          }));
          break;
          
        case 'seudonimo':
          const personasPorSeudonimo = await db.select()
            .from(personasCasos)
            .where(sql`LOWER(${personasCasos.pseudonimo}) LIKE LOWER(${'%' + valor + '%'})`);
          resultados = personasPorSeudonimo.map(p => ({
            id: p.nro,
            expediente: p.expediente,
            cedula: p.cedula,
            nombreCompleto: `${p.nombre} ${p.apellido}`,
            numeroAsociado: p.telefono,
            delito: p.delito,
            fechaInicio: p.fechaDeInicio
          }));
          break;
          
        case 'numero':
          // Buscar en la tabla de teléfonos
          const telefonos = await db.select()
            .from(personaTelefonos)
            .where(sql`${personaTelefonos.numero} LIKE ${'%' + valor + '%'}`);
          
          // Para cada teléfono, obtener la persona asociada
          const personasPromises = telefonos.map(async (tel) => {
            if (tel.personaId) {
              const persona = await storage.getPersonaCasoById(tel.personaId);
              if (persona) {
                return {
                  id: persona.nro,
                  expediente: persona.expediente,
                  cedula: persona.cedula,
                  nombreCompleto: `${persona.nombre} ${persona.apellido}`,
                  numeroAsociado: tel.numero,
                  delito: persona.delito,
                  fechaInicio: persona.fechaDeInicio
                };
              }
            }
            return null;
          });
          
          const personasResults = await Promise.all(personasPromises);
          resultados = personasResults.filter(p => p !== null);
          break;
          
        case 'expediente':
          const personasPorExpediente = await db.select()
            .from(personasCasos)
            .where(sql`LOWER(${personasCasos.expediente}) LIKE LOWER(${'%' + valor + '%'})`);
          resultados = personasPorExpediente.map(p => ({
            id: p.nro,
            expediente: p.expediente,
            cedula: p.cedula,
            nombreCompleto: `${p.nombre} ${p.apellido}`,
            numeroAsociado: p.telefono,
            delito: p.delito,
            fechaInicio: p.fechaDeInicio
          }));
          break;
          
        default:
          return res.status(400).json({ message: 'Tipo de búsqueda no válido' });
      }
      
      res.json({
        resultados,
        total: resultados.length,
        tipoBusqueda: tipo,
        valorBusqueda: valor
      });
    } catch (error: any) {
      console.error('Error en búsqueda de trazabilidad:', error);
      res.status(500).json({ message: 'Error al buscar trazabilidad' });
    }
  });

  // Endpoint para análisis detallado de traza (grafo/mapa de comunicaciones)
  app.get("/api/trazabilidad/:numero", authenticateToken, async (req: any, res) => {
    try {
      const { numero } = req.params;
      
      // 1. Obtener todos los registros donde este número aparece como abonadoA o abonadoB
      const registros = await storage.getRegistrosComunicacionByAbonado(numero);
      
      // 2. Identificar todos los números únicos involucrados
      const numerosUnicos = new Set<string>();
      numerosUnicos.add(numero); // El número central
      
      registros.forEach(reg => {
        if (reg.abonadoA) numerosUnicos.add(reg.abonadoA);
        if (reg.abonadoB) numerosUnicos.add(reg.abonadoB);
      });
      
      // 3. Para cada número, verificar si está asociado a una persona (coincidente) y obtener metadatos
      const numeroPersonaMap = new Map<string, any>();
      const numeroIconoMap = new Map<string, string | null>();
      
      for (const num of Array.from(numerosUnicos)) {
        const telefonos = await db.select()
          .from(personaTelefonos)
          .where(eq(personaTelefonos.numero, num));
        
        if (telefonos.length > 0) {
          // Guardar el icono_tipo si existe
          numeroIconoMap.set(num, telefonos[0].iconoTipo || null);
          
          if (telefonos[0].personaId) {
            const persona = await storage.getPersonaCasoById(telefonos[0].personaId);
            if (persona) {
              numeroPersonaMap.set(num, {
                personaId: persona.nro,
                nombreCompleto: `${persona.nombre} ${persona.apellido}`,
                cedula: persona.cedula,
                delito: persona.delito,
                expediente: persona.expediente,
                fiscalia: persona.fiscalia
              });
            }
          }
        }
      }
      
      // 4. Construir nodos con clasificación y metadatos completos
      const nodos: any[] = [];
      
      for (const num of Array.from(numerosUnicos)) {
        const isCentral = num === numero;
        const personaInfo = numeroPersonaMap.get(num);
        
        let type: string;
        let label: string;
        
        if (isCentral) {
          type = "Principal";
          label = personaInfo ? `${num} (${personaInfo.nombreCompleto})` : num;
        } else if (personaInfo) {
          type = "Coincidente";
          label = `${num} (${personaInfo.nombreCompleto})`;
        } else {
          type = "Externo";
          label = num;
        }
        
        nodos.push({
          id: num,
          label: label,
          type: type,
          personaId: personaInfo?.personaId || null,
          isCentral: isCentral,
          iconoTipo: numeroIconoMap.get(num) || null,
          metadata: personaInfo ? {
            cedula: personaInfo.cedula,
            delito: personaInfo.delito,
            expediente: personaInfo.expediente,
            nombreCompleto: personaInfo.nombreCompleto,
            fiscalia: personaInfo.fiscalia
          } : undefined
        });
      }
      
      // 5. Construir aristas (relaciones) con peso calculado y metadatos completos
      const aristas: any[] = [];
      const weightMap = new Map<string, number>(); // Mapa para contar interacciones entre pares
      
      registros.forEach(reg => {
        const from = reg.abonadoA;
        const to = reg.abonadoB || '';
        const key = `${from}-${to}`;
        weightMap.set(key, (weightMap.get(key) || 0) + 1);
        
        // Construir título descriptivo para tooltip
        const duracion = reg.segundos ? `${reg.segundos}s` : 'N/A';
        const fechaHora = reg.fecha && reg.hora 
          ? `${reg.fecha} ${reg.hora}` 
          : reg.fecha || 'Sin fecha';
        const title = `${reg.tipoYTransaccion || 'Comunicación'} (${duracion}) - ${fechaHora}`;
        
        aristas.push({
          id: reg.registroId,
          from: from,
          to: to,
          title: title,
          weight: 1, // Se actualizará después
          transactionType: reg.tipoYTransaccion || 'Desconocido',
          metadata: {
            fecha: reg.fecha,
            hora: reg.hora,
            segundos: reg.segundos,
            latitud: reg.latitudInicialA,
            longitud: reg.longitudInicialA,
            direccion: reg.direccionInicialA,
            imei1A: reg.imei1A,
            imei2A: reg.imei2A,
            imei1B: reg.imei1B,
            imei2B: reg.imei2B
          }
        });
      });
      
      // 6. Actualizar weight en cada arista según el total de interacciones
      aristas.forEach(arista => {
        const key = `${arista.from}-${arista.to}`;
        arista.weight = weightMap.get(key) || 1;
      });
      
      res.json({
        numeroAnalizado: numero,
        nodos: nodos,
        aristas: aristas,
        totalComunicaciones: registros.length
      });
    } catch (error: any) {
      console.error('Error al analizar traza:', error);
      res.status(500).json({ message: 'Error al analizar trazabilidad' });
    }
  });

  // Endpoint para encontrar coincidencias/casos vinculados
  app.get("/api/trazabilidad/coincidencias/:numero", authenticateToken, async (req: any, res) => {
    try {
      const { numero } = req.params;
      
      // 1. Obtener todos los números con los que este número se ha comunicado
      const registros = await storage.getRegistrosComunicacionByAbonado(numero);
      const numerosContactados = new Set<string>();
      
      registros.forEach(reg => {
        if (reg.abonadoA === numero && reg.abonadoB) {
          numerosContactados.add(reg.abonadoB);
        } else if (reg.abonadoA !== numero) {
          numerosContactados.add(reg.abonadoA);
        }
      });
      
      // 2. Para cada número contactado, buscar si está asociado a alguna persona/caso
      const coincidencias = [];
      
      for (const numContactado of Array.from(numerosContactados)) {
        const telefonos = await db.select()
          .from(personaTelefonos)
          .where(eq(personaTelefonos.numero, numContactado));
        
        for (const tel of telefonos) {
          if (tel.personaId) {
            const persona = await storage.getPersonaCasoById(tel.personaId);
            if (persona) {
              coincidencias.push({
                numeroContactado: numContactado,
                persona: {
                  id: persona.nro,
                  cedula: persona.cedula,
                  nombreCompleto: `${persona.nombre} ${persona.apellido}`,
                  expediente: persona.expediente,
                  delito: persona.delito
                }
              });
            }
          }
        }
      }
      
      res.json({
        numeroAnalizado: numero,
        totalContactos: numerosContactados.size,
        coincidenciasEncontradas: coincidencias.length,
        coincidencias: coincidencias
      });
    } catch (error: any) {
      console.error('Error al buscar coincidencias:', error);
      res.status(500).json({ message: 'Error al buscar coincidencias' });
    }
  });

  // Endpoint para asignar icono a un nodo del grafo
  app.put("/api/asignar-icono", authenticateToken, async (req: any, res) => {
    try {
      const { numero, iconoTipo } = req.body;

      if (!numero) {
        return res.status(400).json({ message: 'El número es requerido' });
      }

      // Buscar el registro del teléfono
      const telefonos = await db.select()
        .from(personaTelefonos)
        .where(eq(personaTelefonos.numero, numero));

      if (telefonos.length === 0) {
        return res.status(404).json({ message: 'Número no encontrado' });
      }

      // Actualizar el icono_tipo
      await db.update(personaTelefonos)
        .set({ iconoTipo: iconoTipo })
        .where(eq(personaTelefonos.numero, numero));

      res.json({ 
        success: true,
        message: 'Icono asignado correctamente',
        numero: numero,
        iconoTipo: iconoTipo
      });
    } catch (error: any) {
      console.error('Error al asignar icono:', error);
      res.status(500).json({ message: 'Error al asignar icono' });
    }
  });

  // Configuración de multer para archivos CSV
  const csvUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
    fileFilter: (req, file, cb) => {
      if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
        cb(null, true);
      } else {
        cb(new Error('Solo se permiten archivos CSV') as any, false);
      }
    }
  });

  // Endpoint para exportar análisis a CSV
  app.get("/api/exportar-analisis/:expediente", authenticateToken, async (req: any, res) => {
    try {
      const { expediente } = req.params;

      // Obtener todas las personas del expediente
      const personas = await db.select()
        .from(personasCasos)
        .where(eq(personasCasos.expediente, expediente));

      if (personas.length === 0) {
        return res.status(404).json({ message: 'No se encontraron registros para este expediente' });
      }

      // Obtener todos los teléfonos asociados a estas personas
      const rows: any[] = [];
      for (const persona of personas) {
        const telefonos = await db.select()
          .from(personaTelefonos)
          .where(eq(personaTelefonos.personaId, persona.nro));

        for (const tel of telefonos) {
          rows.push({
            Cedula: persona.cedula || '',
            Nombre: persona.nombre || '',
            Apellido: persona.apellido || '',
            Numero_Asociado: tel.numero,
            Tipo_de_Uso: tel.tipo || '',
            icono_tipo: tel.iconoTipo || ''
          });
        }
      }

      if (rows.length === 0) {
        return res.status(404).json({ message: 'No se encontraron números asociados para este expediente' });
      }

      // Generar CSV
      const headers = 'Cedula,Nombre,Apellido,Numero_Asociado,Tipo_de_Uso,icono_tipo\n';
      const csvRows = rows.map(row => 
        `"${row.Cedula}","${row.Nombre}","${row.Apellido}","${row.Numero_Asociado}","${row.Tipo_de_Uso}","${row.icono_tipo}"`
      ).join('\n');
      
      const csvContent = headers + csvRows;

      // Enviar como descarga
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="analisis_${expediente}_${Date.now()}.csv"`);
      res.send(csvContent);
    } catch (error: any) {
      console.error('Error al exportar análisis:', error);
      res.status(500).json({ message: 'Error al exportar análisis' });
    }
  });

  // Endpoint para importar análisis desde CSV
  app.post("/api/importar-analisis", authenticateToken, csvUpload.single('file'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No se proporcionó archivo CSV' });
      }

      // Leer el contenido del archivo
      const csvContent = req.file.buffer.toString('utf-8');
      const lines = csvContent.split('\n').filter((line: string) => line.trim()); // Eliminar líneas vacías Cambio
      if (lines.length < 2) {
        return res.status(400).json({ message: 'El archivo CSV está vacío o no tiene datos' });
      }

      // Saltar la primera línea (headers)
      const dataLines = lines.slice(1);
      let actualizados = 0;
      let errores = 0;

      for (const line of dataLines) {
        try {
          // Parsear CSV (manejo simple de comillas)
          const match = line.match(/"([^"]*)","([^"]*)","([^"]*)","([^"]*)","([^"]*)","([^"]*)"/);
          
          if (match) {
            const [, cedula, nombre, apellido, numeroAsociado, tipoDeUso, iconoTipo] = match;

            // Buscar el número en la base de datos
            const telefonos = await db.select()
              .from(personaTelefonos)
              .where(eq(personaTelefonos.numero, numeroAsociado));

            if (telefonos.length > 0) {
              // Actualizar el icono_tipo
              await db.update(personaTelefonos)
                .set({ iconoTipo: iconoTipo || null })
                .where(eq(personaTelefonos.numero, numeroAsociado));
              
              actualizados++;
            }
          }
        } catch (lineError) {
          console.error('Error procesando línea:', line, lineError);
          errores++;
        }
      }

      res.json({
        success: true,
        message: 'Importación completada',
        actualizados,
        errores,
        totalProcesados: dataLines.length
      });
    } catch (error: any) {
      console.error('Error al importar análisis:', error);
      res.status(500).json({ message: 'Error al importar análisis' });
    }
  });

  // Registros Comunicación - CRUD
  app.get("/api/registros-comunicacion", authenticateToken, async (req: any, res) => {
    try {
      const { abonadoA, abonadoB, fecha, page, limit } = req.query;
      const result = await storage.getRegistrosComunicacion({
        abonadoA: abonadoA as string,
        abonadoB: abonadoB as string,
        fecha: fecha as string,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });
      res.json(result);
    } catch (error: any) {
      console.error('Error getting registros comunicacion:', error);
      res.status(500).json({ message: 'Error al obtener registros de comunicación' });
    }
  });

  app.get("/api/registros-comunicacion/:registroId", authenticateToken, async (req: any, res) => {
    try {
      const registroId = parseInt(req.params.registroId);
      const registro = await storage.getRegistroComunicacionById(registroId);
      if (!registro) {
        return res.status(404).json({ message: 'Registro de comunicación no encontrado' });
      }
      res.json(registro);
    } catch (error: any) {
      console.error('Error getting registro comunicacion:', error);
      res.status(500).json({ message: 'Error al obtener registro de comunicación' });
    }
  });

  app.get("/api/registros-comunicacion/abonado/:abonado", authenticateToken, async (req: any, res) => {
    try {
      const { abonado } = req.params;
      const registros = await storage.getRegistrosComunicacionByAbonado(abonado);
      res.json(registros);
    } catch (error: any) {
      console.error('Error getting registros by abonado:', error);
      res.status(500).json({ message: 'Error al obtener registros de comunicación' });
    }
  });

  app.post("/api/registros-comunicacion", authenticateToken, async (req: any, res) => {
    try {
      const validatedData = insertRegistroComunicacionSchema.parse(req.body);
      const newRegistro = await storage.createRegistroComunicacion(validatedData);
      res.status(201).json(newRegistro);
    } catch (error: any) {
      console.error('Error creating registro comunicacion:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: 'Datos inválidos', errors: error.errors });
      }
      res.status(500).json({ message: 'Error al crear registro de comunicación' });
    }
  });

  app.post("/api/registros-comunicacion/bulk", authenticateToken, async (req: any, res) => {
    try {
      const { registros } = req.body;
      if (!Array.isArray(registros)) {
        return res.status(400).json({ message: 'Se esperaba un array de registros' });
      }
      const validatedData = registros.map(r => insertRegistroComunicacionSchema.parse(r));
      const newRegistros = await storage.createRegistrosComunicacionBulk(validatedData);
      res.status(201).json({ 
        message: `${newRegistros.length} registros creados correctamente`,
        registros: newRegistros 
      });
    } catch (error: any) {
      console.error('Error creating bulk registros:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: 'Datos inválidos', errors: error.errors });
      }
      res.status(500).json({ message: 'Error al crear registros de comunicación' });
    }
  });

  // Endpoint para importar registros de comunicación desde archivo (Excel/CSV/TXT)
  app.post("/api/registros-comunicacion/importar", authenticateToken, uploadData.single('archivo'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No se ha enviado ningún archivo' });
      }

      const file = req.file;
      const numeroAsociado = req.body.numeroAsociado; // Opcional
      let registrosParaImportar: any[] = [];

      // Función auxiliar para mapear columnas del archivo a campos de BD
      const mapearRegistro = (row: any): any => {
        return {
          abonadoA: row['ABONADO A'] || row['abonado_a'] || row['AbonadoA'] || '',
          abonadoB: row['ABONADO B'] || row['abonado_b'] || row['AbonadoB'] || '',
          imei1A: row['IMSI ABONADO A'] || row['imsi_abonado_a'] || '',
          imei2A: row['IMEI ABONADO A'] || row['imei_abonado_a'] || '',
          imei1B: row['IMSI ABONADO B'] || row['imsi_abonado_b'] || '',
          imei2B: row['IMEI ABONADO B'] || row['imei_abonado_b'] || '',
          tipoYTransaccion: row['TIPO DE TRANSACCION'] || row['tipo_de_transaccion'] || row['TipoTransaccion'] || '',
          fecha: row['FECHA'] || row['fecha'] || '',
          hora: row['HORA'] || row['hora'] || '',
          segundos: row['SEG'] || row['seg'] || row['segundos'] || null,
          direccionInicialA: row['Atena'] || row['atena'] || row['DIRECCION'] || '',
          latitudInicialA: row['LATITUD CELDAD INICIO A'] || row['latitud_celda_inicio_a'] || row['LATITUD'] || '',
          longitudInicialA: row['LONGITUD CELDA INICIO A'] || row['longitud_celda_inicio_a'] || row['LONGITUD'] || '',
          archivo: file.originalname,
          peso: '',
        };
      };

      // Procesar según el tipo de archivo
      if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
          file.mimetype === 'application/vnd.ms-excel') {
        // Procesar archivo Excel
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(file.buffer);
        const worksheet = workbook.getWorksheet(1);

        if (!worksheet) {
          return res.status(400).json({ message: 'El archivo Excel no contiene hojas' });
        }

        const headers: any = {};
        const rows: any[] = [];

        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1) {
            // Primera fila son los encabezados
            row.eachCell((cell, colNumber) => {
              headers[colNumber] = cell.value?.toString().trim() || '';
            });
          } else {
            // Filas de datos
            const rowData: any = {};
            row.eachCell((cell, colNumber) => {
              const headerName = headers[colNumber];
              if (headerName) {
                rowData[headerName] = cell.value?.toString().trim() || '';
              }
            });
            if (Object.keys(rowData).length > 0) {
              rows.push(rowData);
            }
          }
        });

        registrosParaImportar = rows.map(mapearRegistro);

      } else if (file.mimetype === 'text/csv') {
        // Procesar archivo CSV
        const csvContent = file.buffer.toString('utf-8');
        const lines = csvContent.split('\n').filter((line: string) => line.trim());
        
        if (lines.length < 2) {
          return res.status(400).json({ message: 'El archivo CSV debe contener al menos una fila de encabezados y una fila de datos' });
        }

        const headers = lines[0].split(',').map((h: string) => h.trim().replace(/"/g, ''));
        
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map((v: string) => v.trim().replace(/"/g, ''));
          const rowData: any = {};
          headers.forEach((header: string, index: number) => {
            rowData[header] = values[index] || '';
          });
          registrosParaImportar.push(mapearRegistro(rowData));
        }

      } else if (file.mimetype === 'text/plain') {
        // Procesar archivo TXT (asumimos formato delimitado por tabulaciones o comas)
        const txtContent = file.buffer.toString('utf-8');
        const lines = txtContent.split('\n').filter((line: string) => line.trim());
        
        if (lines.length < 2) {
          return res.status(400).json({ message: 'El archivo TXT debe contener al menos una fila de encabezados y una fila de datos' });
        }

        // Detectar delimitador (tabulación o coma)
        const delimiter = lines[0].includes('\t') ? '\t' : ',';
        const headers = lines[0].split(delimiter).map((h: string) => h.trim().replace(/"/g, ''));
        
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(delimiter).map((v: string) => v.trim().replace(/"/g, ''));
          const rowData: any = {};
          headers.forEach((header: string, index: number) => {
            rowData[header] = values[index] || '';
          });
          registrosParaImportar.push(mapearRegistro(rowData));
        }
      }

      // Filtrar registros vacíos
      registrosParaImportar = registrosParaImportar.filter(r => r.abonadoA && r.abonadoA.trim());

      if (registrosParaImportar.length === 0) {
        return res.status(400).json({ message: 'No se encontraron registros válidos en el archivo' });
      }

      // Obtener o crear números de teléfono en el catálogo
      const numerosUnicos = new Set<string>();
      registrosParaImportar.forEach(r => {
        if (r.abonadoA) numerosUnicos.add(r.abonadoA.trim());
        if (r.abonadoB) numerosUnicos.add(r.abonadoB.trim());
      });

      const numerosTelefonoMap = new Map<string, number>();
      for (const numero of Array.from(numerosUnicos)) {
        let telefono = await storage.getPersonaTelefonoByNumero(numero);
        if (!telefono) {
          // Crear nuevo número en el catálogo
          telefono = await storage.createPersonaTelefono({
            numero,
            tipo: 'móvil',
            activo: true,
            personaId: null,
          });
        }
        numerosTelefonoMap.set(numero, telefono.id);
      }

      // Asignar IDs de teléfono a los registros
      const registrosConIds = registrosParaImportar.map(r => ({
        ...r,
        abonadoAId: r.abonadoA ? numerosTelefonoMap.get(r.abonadoA.trim()) || null : null,
        abonadoBId: r.abonadoB ? numerosTelefonoMap.get(r.abonadoB.trim()) || null : null,
        segundos: r.segundos ? parseInt(r.segundos) : null,
      }));

      // Insertar registros en la base de datos usando bulk
      const newRegistros = await storage.createRegistrosComunicacionBulk(registrosConIds);

      res.status(201).json({
        message: 'Registros importados correctamente',
        registrosImportados: newRegistros.length,
        telefonosNuevos: Array.from(numerosUnicos).length,
      });

    } catch (error: any) {
      console.error('Error importing registros:', error);
      res.status(500).json({ 
        message: 'Error al importar registros de comunicación',
        error: error.message 
      });
    }
  });

  app.put("/api/registros-comunicacion/:registroId", authenticateToken, async (req: any, res) => {
    try {
      const registroId = parseInt(req.params.registroId);
      const validatedData = insertRegistroComunicacionSchema.partial().parse(req.body);
      const updated = await storage.updateRegistroComunicacion(registroId, validatedData);
      if (!updated) {
        return res.status(404).json({ message: 'Registro de comunicación no encontrado' });
      }
      res.json(updated);
    } catch (error: any) {
      console.error('Error updating registro comunicacion:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: 'Datos inválidos', errors: error.errors });
      }
      res.status(500).json({ message: 'Error al actualizar registro de comunicación' });
    }
  });

  app.delete("/api/registros-comunicacion/:registroId", authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const registroId = parseInt(req.params.registroId);
      const deleted = await storage.deleteRegistroComunicacion(registroId);
      if (!deleted) {
        return res.status(404).json({ message: 'Registro de comunicación no encontrado' });
      }
      res.json({ message: 'Registro de comunicación eliminado correctamente' });
    } catch (error: any) {
      console.error('Error deleting registro comunicacion:', error);
      res.status(500).json({ message: 'Error al eliminar registro de comunicación' });
    }
  });

  // Endpoint especial para búsqueda de trazabilidad (JOIN mejorado)
  app.get("/api/trazabilidad/:telefono", authenticateToken, async (req: any, res) => {
    try {
      const { telefono } = req.params;
      
      // Buscar el número en el catálogo de teléfonos
      const telefonoCatalogo = await storage.getPersonaTelefonoByNumero(telefono);
      
      let persona = null;
      let todosLosTelefonos: any[] = [];
      let registrosPorIds: any[] = [];
      
      if (telefonoCatalogo && telefonoCatalogo.personaId) {
        // Si está catalogado, obtener la persona y todos sus teléfonos
        persona = await storage.getPersonaCasoById(telefonoCatalogo.personaId);
        todosLosTelefonos = await storage.getPersonaTelefonos(telefonoCatalogo.personaId);
        
        // Obtener registros usando los IDs de teléfono (más eficiente)
        const telefonoIds = todosLosTelefonos.map(t => t.id);
        if (telefonoIds.length > 0) {
          registrosPorIds = await storage.getRegistrosComunicacionByTelefonoIds(telefonoIds);
        }
      }
      
      // SIEMPRE buscar también por el string del número (captura registros históricos no catalogados)
      const registrosPorString = await storage.getRegistrosComunicacionByAbonado(telefono);
      
      // Combinar y eliminar duplicados (usar registroId como clave única)
      const registrosMap = new Map();
      [...registrosPorIds, ...registrosPorString].forEach(r => {
        registrosMap.set(r.registroId, r);
      });
      const registros = Array.from(registrosMap.values());
      
      // Respuesta combinada
      res.json({
        persona,
        telefonosAsociados: todosLosTelefonos,
        registrosComunicacion: registros,
        totalRegistros: registros.length,
        esCatalogado: telefonoCatalogo !== null,
        busqueda: {
          porTelefonoId: registrosPorIds.length,
          porString: registrosPorString.length,
          total: registros.length
        }
      });
    } catch (error: any) {
      console.error('Error getting trazabilidad:', error);
      res.status(500).json({ message: 'Error al obtener trazabilidad' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}







