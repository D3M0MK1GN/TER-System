/**
 * 📊 RUTAS DE ESTADÍSTICAS Y CONTADORES
 * 
 * Este archivo maneja todas las rutas relacionadas con estadísticas
 * y contadores del sistema TER-System.
 */

import type { Express } from "express";
import { getActiveUsersCount } from "../tools/clean";

/**
 * Registra todas las rutas de estadísticas
 * @param app - Instancia de Express
 * @param authenticateToken - Middleware de autenticación
 */
export function registerStatsRoutes(app: Express, authenticateToken: any) {
  
  // Ruta para obtener el conteo de usuarios activos
  app.get("/api/users/active-count", authenticateToken, async (req, res) => {
    try {
      const activeUsers = await getActiveUsersCount();
      console.log('📊 Stats - Active users count:', activeUsers);
      res.json({ activeUsers });
    } catch (error) {
      console.error('❌ Error obteniendo usuarios activos:', error);
      res.status(500).json({ message: "Error obteniendo conteo de usuarios activos" });
    }
  });

  // Aquí se pueden agregar más rutas de estadísticas en el futuro
  // Por ejemplo:
  // - /api/stats/requests-per-day
  // - /api/stats/operator-distribution  
  // - /api/stats/system-health
}