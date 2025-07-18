import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import {
  insertUserSchema,
  insertSolicitudSchema,
  insertPlantillaCorreoSchema,
  insertPlantillaWordSchema,
  loginSchema,
  type User,
} from "@shared/schema";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import multer from "multer";
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "fs";
import path from "path";

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
      cb(new Error('Solo se permiten archivos Word (.doc, .docx)'), false);
    }
  }
});

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!existsSync(uploadsDir)) {
  mkdirSync(uploadsDir, { recursive: true });
}

// Function to generate user guide HTML content
function generateUserGuideHTML(): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Guía de Usuario - SistelCom</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9f9f9;
        }
        .header {
            background: linear-gradient(135deg, #2563eb, #1d4ed8);
            color: white;
            padding: 2rem;
            border-radius: 8px;
            text-align: center;
            margin-bottom: 2rem;
        }
        .header h1 {
            margin: 0;
            font-size: 2.5rem;
        }
        .header p {
            margin: 0.5rem 0 0 0;
            opacity: 0.9;
        }
        .section {
            background: white;
            padding: 1.5rem;
            margin-bottom: 1.5rem;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h2 {
            color: #2563eb;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 0.5rem;
            margin-top: 0;
        }
        h3 {
            color: #374151;
            margin-top: 1.5rem;
        }
        .feature-list {
            list-style: none;
            padding: 0;
        }
        .feature-list li {
            padding: 0.5rem;
            margin: 0.5rem 0;
            background: #f3f4f6;
            border-left: 4px solid #2563eb;
            border-radius: 4px;
        }
        .step-list {
            counter-reset: step-counter;
        }
        .step-list li {
            counter-increment: step-counter;
            margin: 1rem 0;
            padding: 1rem;
            background: #f8fafc;
            border-radius: 6px;
            position: relative;
            padding-left: 3rem;
        }
        .step-list li::before {
            content: counter(step-counter);
            position: absolute;
            left: 1rem;
            top: 1rem;
            background: #2563eb;
            color: white;
            width: 1.5rem;
            height: 1.5rem;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 0.8rem;
        }
        .warning {
            background: #fef3cd;
            border: 1px solid #fbbf24;
            padding: 1rem;
            border-radius: 6px;
            margin: 1rem 0;
        }
        .warning::before {
            content: "⚠️ ";
            font-weight: bold;
        }
        .tip {
            background: #dbeafe;
            border: 1px solid #3b82f6;
            padding: 1rem;
            border-radius: 6px;
            margin: 1rem 0;
        }
        .tip::before {
            content: "💡 ";
            font-weight: bold;
        }
        .print-button {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #2563eb;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 16px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .print-button:hover {
            background: #1d4ed8;
        }
        @media print {
            body { background: white; padding: 0; }
            .section { box-shadow: none; }
            .print-button { display: none; }
        }
    </style>
</head>
<body>
    <button class="print-button" onclick="window.print()">Imprimir / Guardar PDF</button>
    
    <div class="header">
        <h1>📡 SistelCom</h1>
        <p>Guía de Usuario - Sistema de Gestión de Solicitudes de Telecomunicaciones</p>
    </div>

    <div class="section">
        <h2>🏠 Introducción</h2>
        <p>SistelCom es un sistema integral para la gestión de solicitudes de telecomunicaciones dirigidas a operadores venezolanos. Esta guía te ayudará a utilizar todas las funcionalidades del sistema de manera eficiente.</p>
        
        <h3>Operadores Soportados</h3>
        <ul class="feature-list">
            <li><strong>Digitel:</strong> Operador de telecomunicaciones venezolano</li>
            <li><strong>Movistar:</strong> Operador de telecomunicaciones venezolano</li>
            <li><strong>Movilnet:</strong> Operador de telecomunicaciones venezolano</li>
        </ul>
    </div>

    <div class="section">
        <h2>🔐 Inicio de Sesión</h2>
        <ol class="step-list">
            <li>Ingresa tu nombre de usuario en el campo correspondiente</li>
            <li>Introduce tu contraseña</li>
            <li>Haz clic en "Iniciar Sesión"</li>
            <li>Serás redirigido al Dashboard principal</li>
        </ol>
        
        <div class="warning">
            Si tienes problemas para acceder, contacta al administrador del sistema para verificar que tu cuenta esté activa.
        </div>
    </div>

    <div class="section">
        <h2>📊 Dashboard Principal</h2>
        <p>El Dashboard te proporciona una vista general del estado del sistema:</p>
        
        <h3>Estadísticas Principales</h3>
        <ul class="feature-list">
            <li><strong>Total de Solicitudes:</strong> Número total de solicitudes en el sistema</li>
            <li><strong>Solicitudes Procesando:</strong> Solicitudes en proceso de gestión</li>
            <li><strong>Solicitudes Enviadas:</strong> Solicitudes enviadas a operadores</li>
            <li><strong>Solicitudes Respondidas:</strong> Solicitudes con respuesta recibida</li>
            <li><strong>Solicitudes Rechazadas:</strong> Solicitudes rechazadas por operadores</li>
        </ul>

        <div class="tip">
            Las estadísticas se actualizan en tiempo real cada vez que se modifica una solicitud.
        </div>
    </div>

    <div class="section">
        <h2>📝 Gestión de Solicitudes</h2>
        
        <h3>Crear Nueva Solicitud</h3>
        <ol class="step-list">
            <li>Ve a la sección "Gestión de Solicitudes"</li>
            <li>Haz clic en "Nueva Solicitud"</li>
            <li>Completa todos los campos requeridos:
                <ul>
                    <li><strong>Número de Expediente:</strong> Ejemplo: "K-25-0271-00079"</li>
                    <li><strong>Número de Solicitud:</strong> Ejemplo: "0271-1081" (debe ser único)</li>
                    <li><strong>Fiscal:</strong> Nombre del fiscal responsable</li>
                    <li><strong>Tipo de Experticia:</strong> Selecciona del menú desplegable</li>
                    <li><strong>Coordinación Solicitante:</strong> Selecciona del menú desplegable</li>
                    <li><strong>Operador:</strong> Digitel, Movistar o Movilnet</li>
                    <li><strong>Información de la Línea:</strong> Datos específicos según experticia</li>
                    <li><strong>Reseña:</strong> Descripción detallada de la solicitud</li>
                </ul>
            </li>
            <li>Haz clic en "Crear Solicitud"</li>
        </ol>

        <h3>Buscar y Filtrar Solicitudes</h3>
        <ul class="feature-list">
            <li><strong>Búsqueda por texto:</strong> Busca por número de solicitud, expediente o fiscal</li>
            <li><strong>Filtro por operador:</strong> Muestra solo solicitudes de un operador específico</li>
            <li><strong>Filtro por estado:</strong> Filtra por estado de la solicitud</li>
            <li><strong>Paginación:</strong> Navega entre páginas de resultados</li>
        </ul>

        <h3>Estados de Solicitudes</h3>
        <ul class="feature-list">
            <li><strong>Procesando:</strong> Solicitud en proceso interno</li>
            <li><strong>Enviada:</strong> Solicitud enviada al operador</li>
            <li><strong>Respondida:</strong> Operador ha enviado respuesta</li>
            <li><strong>Rechazada:</strong> Solicitud rechazada por el operador</li>
        </ul>

        <div class="warning">
            Los usuarios normales y supervisores solo pueden editar solicitudes en estado "Enviada". Los administradores pueden editar solicitudes en cualquier estado.
        </div>
    </div>

    <div class="section">
        <h2>📧 Plantillas de Correo</h2>
        <p><em>Esta funcionalidad está disponible solo para administradores.</em></p>
        
        <ol class="step-list">
            <li>Ve a la sección "Plantillas de Correo"</li>
            <li>Haz clic en "Nueva Plantilla"</li>
            <li>Completa los campos:
                <ul>
                    <li><strong>Nombre:</strong> Identificador de la plantilla</li>
                    <li><strong>Operador:</strong> Operador al que se dirige</li>
                    <li><strong>Asunto:</strong> Asunto del correo electrónico</li>
                    <li><strong>Cuerpo:</strong> Contenido del correo con variables dinámicas</li>
                </ul>
            </li>
            <li>Guarda la plantilla para uso futuro</li>
        </ol>

        <div class="tip">
            Puedes usar variables en las plantillas que se reemplazarán automáticamente con los datos de la solicitud.
        </div>
    </div>

    <div class="section">
        <h2>📈 Reportes</h2>
        <p>La sección de reportes te permite analizar el desempeño del sistema:</p>
        
        <ul class="feature-list">
            <li><strong>Reportes por período:</strong> Analiza solicitudes en rangos de fechas</li>
            <li><strong>Reportes por operador:</strong> Estadísticas específicas por operador</li>
            <li><strong>Reportes por estado:</strong> Distribución de solicitudes por estado</li>
            <li><strong>Exportación:</strong> Descarga reportes en diferentes formatos</li>
        </ul>
    </div>

    <div class="section">
        <h2>👥 Gestión de Usuarios</h2>
        <p><em>Esta funcionalidad está disponible solo para administradores.</em></p>
        
        <h3>Roles de Usuario</h3>
        <ul class="feature-list">
            <li><strong>Administrador:</strong> Acceso completo al sistema</li>
            <li><strong>Supervisor:</strong> Puede ver/gestionar todas las solicitudes, sin gestión de usuarios</li>
            <li><strong>Usuario:</strong> Solo puede ver/gestionar sus propias solicitudes</li>
        </ul>

        <h3>Estados de Usuario</h3>
        <ul class="feature-list">
            <li><strong>Activo:</strong> Usuario puede acceder al sistema</li>
            <li><strong>Suspendido:</strong> Acceso temporalmente restringido</li>
            <li><strong>Bloqueado:</strong> Acceso permanentemente restringido</li>
        </ul>
    </div>

    <div class="section">
        <h2>🔔 Notificaciones</h2>
        <p>El sistema te mantiene informado sobre cambios importantes:</p>
        
        <ul class="feature-list">
            <li>Cambios en el estado de tus solicitudes</li>
            <li>Respuestas recibidas de operadores</li>
            <li>Nuevas asignaciones (para supervisores)</li>
            <li>Alertas del sistema</li>
        </ul>

        <div class="tip">
            Haz clic en el ícono de campana en la barra superior para ver tus notificaciones pendientes.
        </div>
    </div>

    <div class="section">
        <h2>❓ Solución de Problemas</h2>
        
        <h3>Problemas Comunes</h3>
        <ul class="feature-list">
            <li><strong>No puedo crear una solicitud:</strong> Verifica que el número de solicitud sea único</li>
            <li><strong>No veo todas las solicitudes:</strong> Tu rol determina qué solicitudes puedes ver</li>
            <li><strong>No puedo editar una solicitud:</strong> Solo se pueden editar solicitudes en estado "Enviada" (excepto administradores)</li>
            <li><strong>No recibo notificaciones:</strong> Verifica tu conexión y refresca la página</li>
        </ul>

        <h3>Contacto</h3>
        <p>Para soporte técnico o problemas con el sistema, contacta al administrador del sistema.</p>
    </div>

    <div class="section">
        <h2>📅 Información de Versión</h2>
        <p><strong>Sistema:</strong> SistelCom v1.0</p>
        <p><strong>Última actualización:</strong> Julio 2025</p>
        <p><strong>Soporte:</strong> PostgreSQL, React, Node.js</p>
    </div>

</body>
</html>
`;
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
      console.error('JWT verification error:', err.message);
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
      console.error('Error in authentication middleware:', error);
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
      console.error("Error checking expired suspensions:", error);
    }
  }, 5 * 60 * 1000); // 5 minutes

  // Background task to clean up old notifications every hour
  const notificationCleanupInterval = setInterval(async () => {
    try {
      await storage.cleanupOldNotifications();
    } catch (error) {
      console.error("Error cleaning up old notifications:", error);
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
      console.error("Error en login:", error);
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
      console.error("Error en logout:", error);
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
      const userId = req.query.userId ? parseInt(req.query.userId) : null;
      const userRole = req.user.rol;
      
      // For regular users, only show their own data
      let stats;
      if (userRole === "usuario") {
        stats = await storage.getDashboardStatsByUser(req.user.id);
      } else if (userId && userRole === "usuario") {
        // Users can only see their own data
        stats = await storage.getDashboardStatsByUser(req.user.id);
      } else {
        // Admins and supervisors can see all data
        stats = await storage.getDashboardStats();
      }
      
      res.json(stats);
    } catch (error) {
      console.error("Error obteniendo estadísticas:", error);
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
        search: req.query.search as string,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
      };

      // For regular users, only show their own requests
      if (req.user.rol === "usuario") {
        const result = await storage.getSolicitudesByUser(req.user.id, filters);
        res.json(result);
      } else {
        // Admins and supervisors can see all requests
        const result = await storage.getSolicitudes(filters);
        res.json(result);
      }
    } catch (error) {
      console.error("Error obteniendo solicitudes:", error);
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
      console.error("Error obteniendo solicitud:", error);
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

      res.status(201).json(solicitud);
    } catch (error) {
      console.error("Error creando solicitud:", error);
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
      console.error("Error actualizando solicitud:", error);
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
      console.error("Error eliminando solicitud:", error);
      res.status(500).json({ message: "Error eliminando solicitud" });
    }
  });

  // Plantillas Routes
  app.get("/api/plantillas", authenticateToken, async (req: any, res) => {
    try {
      const plantillas = await storage.getPlantillasCorreo(req.user.id);
      res.json(plantillas);
    } catch (error) {
      console.error("Error obteniendo plantillas:", error);
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
      console.error("Error creando plantilla:", error);
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
      console.error("Error actualizando plantilla:", error);
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
      console.error("Error eliminando plantilla:", error);
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
      console.error("Error obteniendo usuarios:", error);
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
      console.error("Error creando usuario:", error);
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
      console.error("Error actualizando usuario:", error);
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
      console.error("Error eliminando usuario:", error);
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
      console.error("Error obteniendo historial:", error);
      res.status(500).json({ message: "Error obteniendo historial" });
    }
  });

  // Notifications routes
  app.get("/api/notifications", authenticateToken, async (req: any, res) => {
    try {
      const notifications = await storage.getNotificacionesByUser(req.user.id);
      res.json(notifications);
    } catch (error) {
      console.error("Error obteniendo notificaciones:", error);
      res.status(500).json({ message: "Error obteniendo notificaciones" });
    }
  });

  app.put("/api/notifications/:id/read", authenticateToken, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.markNotificacionAsRead(id);
      res.json({ message: "Notificación marcada como leída" });
    } catch (error) {
      console.error("Error marcando notificación como leída:", error);
      res.status(500).json({ message: "Error marcando notificación como leída" });
    }
  });

  app.get("/api/notifications/unread-count", authenticateToken, async (req: any, res) => {
    try {
      const count = await storage.getUnreadNotificationsCount(req.user.id);
      res.json({ count });
    } catch (error) {
      console.error("Error obteniendo conteo de notificaciones:", error);
      res.status(500).json({ message: "Error obteniendo conteo de notificaciones" });
    }
  });

  // Guide PDF Generation Route
  app.get("/api/guide/pdf", authenticateToken, async (req: any, res) => {
    try {
      const guideContent = generateUserGuideHTML();
      
      // Set response headers for PDF download
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Content-Disposition', 'inline; filename="guia-usuario-sistelcom.html"');
      
      res.send(guideContent);
    } catch (error) {
      console.error("Error generando guía:", error);
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
      console.error("Error obteniendo plantillas Word:", error);
      res.status(500).json({ message: "Error obteniendo plantillas Word" });
    }
  });

  app.post("/api/plantillas-word", authenticateToken, requireAdmin, upload.single('archivo'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No se proporcionó archivo" });
      }

      const { nombre, tipoExperticia } = req.body;
      
      // Validate request body
      if (!nombre || !tipoExperticia) {
        return res.status(400).json({ message: "Nombre y tipo de experticia son requeridos" });
      }

      // Check if a template already exists for this expertise type
      const existingTemplate = await storage.getPlantillaWordByTipoExperticia(tipoExperticia);
      if (existingTemplate) {
        return res.status(400).json({ message: "Ya existe una plantilla para este tipo de experticia" });
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
        archivo: filePath,
        nombreArchivo: req.file.originalname,
        tamaño: req.file.size,
        usuarioId: req.user.id,
      };

      const plantilla = await storage.createPlantillaWord(plantillaData);
      res.json(plantilla);
    } catch (error) {
      console.error("Error creando plantilla Word:", error);
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
      console.error("Error obteniendo plantilla Word:", error);
      res.status(500).json({ message: "Error obteniendo plantilla Word" });
    }
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
      console.error("Error descargando plantilla Word:", error);
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
        const fs = require('fs');
        fs.unlinkSync(plantilla.archivo);
      }

      // Delete record from database
      const deleted = await storage.deletePlantillaWord(id);
      
      if (deleted) {
        res.json({ message: "Plantilla eliminada exitosamente" });
      } else {
        res.status(500).json({ message: "Error eliminando plantilla" });
      }
    } catch (error) {
      console.error("Error eliminando plantilla Word:", error);
      res.status(500).json({ message: "Error eliminando plantilla Word" });
    }
  });

  // Route to get template by expertise type (for automatic download)
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
      console.error("Error descargando plantilla por experticia:", error);
      res.status(500).json({ message: "Error descargando plantilla" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
