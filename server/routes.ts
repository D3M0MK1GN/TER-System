import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertUserSchema,
  insertSolicitudSchema,
  insertPlantillaCorreoSchema,
  loginSchema,
  type User,
} from "@shared/schema";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

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
      return res.status(403).json({ message: 'Token inválido' });
    }

    const user = await storage.getUser(decoded.userId);
    if (!user) {
      return res.status(403).json({ message: 'Usuario no encontrado' });
    }

    req.user = user;
    next();
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
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
      
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Credenciales inválidas" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Credenciales inválidas" });
      }

      if (!user.activo) {
        return res.status(401).json({ message: "Usuario inactivo" });
      }

      // Actualizar último acceso
      await storage.updateUserLastAccess(user.id);

      const token = jwt.sign(
        { userId: user.id, username: user.username },
        JWT_SECRET,
        { expiresIn: "24h" }
      );

      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          nombre: user.nombre,
          email: user.email,
          rol: user.rol,
        },
      });
    } catch (error) {
      console.error("Error en login:", error);
      res.status(400).json({ message: "Error en el login" });
    }
  });

  app.post("/api/auth/logout", authenticateToken, async (req, res) => {
    res.json({ message: "Sesión cerrada exitosamente" });
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

  // Dashboard Routes
  app.get("/api/dashboard/stats", authenticateToken, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error obteniendo estadísticas:", error);
      res.status(500).json({ message: "Error obteniendo estadísticas" });
    }
  });

  // Solicitudes Routes
  app.get("/api/solicitudes", authenticateToken, async (req, res) => {
    try {
      const filters = {
        operador: req.query.operador as string,
        estado: req.query.estado as string,
        tipoExperticia: req.query.tipoExperticia as string,
        search: req.query.search as string,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
      };

      const result = await storage.getSolicitudes(filters);
      res.json(result);
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
      const solicitudData = insertSolicitudSchema.parse({
        ...req.body,
        usuarioId: req.user.id,
      });

      const solicitud = await storage.createSolicitud(solicitudData);
      
      // Crear historial
      await storage.createHistorial({
        solicitudId: solicitud.id,
        accion: "creada",
        descripcion: "Solicitud creada",
        usuarioId: req.user.id,
      });

      res.status(201).json(solicitud);
    } catch (error) {
      console.error("Error creando solicitud:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Datos inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Error creando solicitud" });
    }
  });

  app.put("/api/solicitudes/:id", authenticateToken, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const solicitudData = insertSolicitudSchema.partial().parse(req.body);

      const solicitud = await storage.updateSolicitud(id, solicitudData);
      
      if (!solicitud) {
        return res.status(404).json({ message: "Solicitud no encontrada" });
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
      res.status(500).json({ message: "Error actualizando solicitud" });
    }
  });

  app.delete("/api/solicitudes/:id", authenticateToken, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
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

  const httpServer = createServer(app);
  return httpServer;
}
