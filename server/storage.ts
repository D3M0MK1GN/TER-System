import {
  users,
  solicitudes,
  plantillasCorreo,
  historialSolicitudes,
  notificaciones,
  plantillasWord,
  type User,
  type InsertUser,
  type Solicitud,
  type InsertSolicitud,
  type PlantillaCorreo,
  type InsertPlantillaCorreo,
  type PlantillaWord,
  type InsertPlantillaWord,
  type HistorialSolicitud,
  type InsertHistorialSolicitud,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, like, count, sql, lt, inArray, notInArray } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUsers(filters?: {
    search?: string;
    status?: string;
    rol?: string;
    page?: number;
    limit?: number;
  }): Promise<{ users: User[]; total: number }>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  updateUserLastAccess(id: number, ip?: string): Promise<void>;
  incrementFailedAttempts(username: string): Promise<void>;
  resetFailedAttempts(username: string): Promise<void>;
  checkAndSuspendUser(username: string): Promise<boolean>;
  checkSuspensionExpired(userId: number): Promise<boolean>;
  notifyAdminsOfSentRequest(solicitudId: number, numeroSolicitud: string): Promise<void>;
  notifyUserSuspensionLifted(userId: number): Promise<void>;
  notifyAdminsOfFailedLoginSuspension(username: string, ip: string): Promise<void>;
  cleanupOldNotifications(): Promise<void>;
  
  // Session management
  setUserSession(userId: number, sessionToken: string, expiresAt: Date): Promise<void>;
  clearUserSession(userId: number): Promise<void>;
  getUserBySessionToken(sessionToken: string): Promise<User | undefined>;
  isSessionActive(userId: number): Promise<boolean>;

  // Solicitudes
  getSolicitudes(filters?: {
    operador?: string;
    estado?: string;
    tipoExperticia?: string;
    search?: string;
    coordinacionSolicitante?: string;
    page?: number;
    limit?: number;
  }): Promise<{ solicitudes: Solicitud[]; total: number }>;
  
  getSolicitudesByUser(userId: number, filters?: {
    operador?: string;
    estado?: string;
    tipoExperticia?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ solicitudes: Solicitud[]; total: number }>;


  getSolicitudById(id: number): Promise<Solicitud | undefined>;
  getSolicitudByNumero(numeroSolicitud: string): Promise<Solicitud | undefined>;
  createSolicitud(solicitud: InsertSolicitud): Promise<Solicitud>;
  updateSolicitud(id: number, solicitud: Partial<InsertSolicitud>): Promise<Solicitud | undefined>;
  deleteSolicitud(id: number): Promise<boolean>;

  // Plantillas de correo
  getPlantillasCorreo(usuarioId?: number): Promise<PlantillaCorreo[]>;
  getPlantillaCorreoById(id: number): Promise<PlantillaCorreo | undefined>;
  
  // Plantillas Word
  getPlantillasWord(tipoExperticia?: string): Promise<PlantillaWord[]>;
  getPlantillaWordById(id: number): Promise<PlantillaWord | undefined>;
  getPlantillaWordByTipoExperticia(tipoExperticia: string): Promise<PlantillaWord | undefined>;
  createPlantillaWord(plantilla: InsertPlantillaWord): Promise<PlantillaWord>;
  updatePlantillaWord(id: number, plantilla: Partial<InsertPlantillaWord>): Promise<PlantillaWord | undefined>;
  deletePlantillaWord(id: number): Promise<boolean>;
  
  createPlantillaCorreo(plantilla: InsertPlantillaCorreo): Promise<PlantillaCorreo>;
  updatePlantillaCorreo(id: number, plantilla: Partial<InsertPlantillaCorreo>): Promise<PlantillaCorreo | undefined>;
  deletePlantillaCorreo(id: number): Promise<boolean>;

  // Historial
  createHistorial(historial: InsertHistorialSolicitud): Promise<HistorialSolicitud>;
  getHistorialBySolicitud(solicitudId: number): Promise<HistorialSolicitud[]>;

  // Notificaciones
  createNotificacion(userId: number, solicitudId: number, mensaje: string): Promise<void>;
  getNotificacionesByUser(userId: number): Promise<any[]>;
  markNotificacionAsRead(notificationId: number): Promise<void>;
  getUnreadNotificationsCount(userId: number): Promise<number>;

  // Dashboard stats
  getDashboardStats(): Promise<{
    totalSolicitudes: number;
    pendientes: number;
    enviadas: number;
    respondidas: number;
    rechazadas: number;
    solicitudesPorOperador: { operador: string; total: number }[];
    actividadReciente: any[];
  }>;
  
  getDashboardStatsByUser(userId: number): Promise<{
    totalSolicitudes: number;
    pendientes: number;
    enviadas: number;
    respondidas: number;
    rechazadas: number;
    solicitudesPorOperador: { operador: string; total: number }[];
    actividadReciente: any[];
  }>;


}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getUsers(filters?: {
    search?: string;
    status?: string;
    rol?: string;
    page?: number;
    limit?: number;
  }): Promise<{ users: User[]; total: number }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const offset = (page - 1) * limit;

    let whereConditions: any[] = [];

    if (filters?.search) {
      whereConditions.push(
        or(
          like(users.nombre, `%${filters.search}%`),
          like(users.username, `%${filters.search}%`),
          like(users.email, `%${filters.search}%`)
        )
      );
    }

    if (filters?.status) {
      if (filters.status === "inactivo") {
        whereConditions.push(eq(users.activo, false));
      } else {
        whereConditions.push(eq(users.status, filters.status as any));
      }
    }

    if (filters?.rol) {
      whereConditions.push(eq(users.rol, filters.rol));
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    const [usersResult, totalResult] = await Promise.all([
      db
        .select()
        .from(users)
        .where(whereClause)
        .orderBy(desc(users.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: count() })
        .from(users)
        .where(whereClause)
    ]);

    return {
      users: usersResult,
      total: totalResult[0]?.count || 0,
    };
  }

  async updateUser(id: number, updateData: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async updateUserLastAccess(id: number, ip?: string): Promise<void> {
    const updateData: { ultimoAcceso: Date; direccionIp?: string } = { 
      ultimoAcceso: new Date() 
    };
    if (ip) {
      updateData.direccionIp = ip;
    }
    await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id));
  }

  async getSolicitudes(filters?: {
    operador?: string;
    estado?: string;
    tipoExperticia?: string;
    search?: string;
    coordinacionSolicitante?: string;
    page?: number;
    limit?: number;
  }): Promise<{ solicitudes: Solicitud[]; total: number }> {
    try {
      const page = Math.max(1, filters?.page || 1);
      const limit = Math.min(100, Math.max(1, filters?.limit || 10)); // Limit max page size
      const offset = (page - 1) * limit;

      let whereConditions: any[] = [];

      if (filters?.operador && filters.operador.trim()) {
        whereConditions.push(eq(solicitudes.operador, filters.operador as any));
      }

      if (filters?.estado && filters.estado.trim()) {
        whereConditions.push(eq(solicitudes.estado, filters.estado as any));
      }

      if (filters?.tipoExperticia && filters.tipoExperticia.trim()) {
        whereConditions.push(eq(solicitudes.tipoExperticia, filters.tipoExperticia as any));
      }

      if (filters?.coordinacionSolicitante && filters.coordinacionSolicitante.trim()) {
        whereConditions.push(eq(solicitudes.coordinacionSolicitante, filters.coordinacionSolicitante as any));
      }

      if (filters?.search && filters.search.trim()) {
        const searchTerm = `%${filters.search.trim()}%`;
        whereConditions.push(
          or(
            like(solicitudes.numeroSolicitud, searchTerm),
            like(solicitudes.numeroExpediente, searchTerm),
            like(solicitudes.fiscal, searchTerm)
          )
        );
      }

      const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

      const [solicitudesResult, totalResult] = await Promise.all([
        db
          .select()
          .from(solicitudes)
          .where(whereClause)
          .orderBy(desc(solicitudes.fechaSolicitud))
          .limit(limit)
          .offset(offset),
        db
          .select({ count: count() })
          .from(solicitudes)
          .where(whereClause)
      ]);

      return {
        solicitudes: solicitudesResult,
        total: totalResult[0]?.count || 0,
      };
    } catch (error) {
      console.error('Error in getSolicitudes:', error);
      throw error;
    }
  }

  async getSolicitudById(id: number): Promise<Solicitud | undefined> {
    const [solicitud] = await db.select().from(solicitudes).where(eq(solicitudes.id, id));
    return solicitud || undefined;
  }

  async getSolicitudByNumero(numeroSolicitud: string): Promise<Solicitud | undefined> {
    const [solicitud] = await db.select().from(solicitudes).where(eq(solicitudes.numeroSolicitud, numeroSolicitud));
    return solicitud || undefined;
  }

  async createSolicitud(solicitud: InsertSolicitud): Promise<Solicitud> {
    const [newSolicitud] = await db.insert(solicitudes).values(solicitud).returning();
    return newSolicitud;
  }

  async updateSolicitud(id: number, solicitud: Partial<InsertSolicitud>): Promise<Solicitud | undefined> {
    const [updatedSolicitud] = await db
      .update(solicitudes)
      .set({ ...solicitud, updatedAt: new Date() })
      .where(eq(solicitudes.id, id))
      .returning();
    return updatedSolicitud || undefined;
  }

  async deleteSolicitud(id: number): Promise<boolean> {
    try {
      // Use transaction to ensure data consistency
      return await db.transaction(async (tx) => {
        // First delete related notifications
        await tx.delete(notificaciones).where(eq(notificaciones.solicitudId, id));
        
        // Then delete history records
        await tx.delete(historialSolicitudes).where(eq(historialSolicitudes.solicitudId, id));
        
        // Finally delete the solicitud
        const result = await tx.delete(solicitudes).where(eq(solicitudes.id, id));
        return (result.rowCount || 0) > 0;
      });
    } catch (error) {
      console.error('Error in deleteSolicitud:', error);
      throw error;
    }
  }

  async getPlantillasCorreo(usuarioId?: number): Promise<PlantillaCorreo[]> {
    const whereClause = usuarioId ? eq(plantillasCorreo.usuarioId, usuarioId) : undefined;
    return await db.select().from(plantillasCorreo).where(whereClause);
  }

  async getPlantillaCorreoById(id: number): Promise<PlantillaCorreo | undefined> {
    const [plantilla] = await db.select().from(plantillasCorreo).where(eq(plantillasCorreo.id, id));
    return plantilla || undefined;
  }

  async createPlantillaCorreo(plantilla: InsertPlantillaCorreo): Promise<PlantillaCorreo> {
    const [newPlantilla] = await db.insert(plantillasCorreo).values(plantilla).returning();
    return newPlantilla;
  }

  async updatePlantillaCorreo(id: number, plantilla: Partial<InsertPlantillaCorreo>): Promise<PlantillaCorreo | undefined> {
    const [updatedPlantilla] = await db
      .update(plantillasCorreo)
      .set({ ...plantilla, updatedAt: new Date() })
      .where(eq(plantillasCorreo.id, id))
      .returning();
    return updatedPlantilla || undefined;
  }

  async deletePlantillaCorreo(id: number): Promise<boolean> {
    const result = await db.delete(plantillasCorreo).where(eq(plantillasCorreo.id, id));
    return (result.rowCount || 0) > 0;
  }

  async createHistorial(historial: InsertHistorialSolicitud): Promise<HistorialSolicitud> {
    const [newHistorial] = await db.insert(historialSolicitudes).values(historial).returning();
    return newHistorial;
  }

  async getHistorialBySolicitud(solicitudId: number): Promise<HistorialSolicitud[]> {
    return await db
      .select()
      .from(historialSolicitudes)
      .where(eq(historialSolicitudes.solicitudId, solicitudId))
      .orderBy(desc(historialSolicitudes.createdAt));
  }

  async getDashboardStats(): Promise<{
    totalSolicitudes: number;
    pendientes: number;
    enviadas: number;
    respondidas: number;
    rechazadas: number;
    solicitudesPorOperador: { operador: string; total: number }[];
    actividadReciente: any[];
  }> {
    const [
      totalSolicitudes,
      pendientes,
      enviadas,
      respondidas,
      rechazadas,
      solicitudesPorOperador,
      actividadReciente,
    ] = await Promise.all([
      db.select({ count: count() }).from(solicitudes),
      db.select({ count: count() }).from(solicitudes).where(eq(solicitudes.estado, "procesando")),
      db.select({ count: count() }).from(solicitudes).where(eq(solicitudes.estado, "enviada")),
      db.select({ count: count() }).from(solicitudes).where(eq(solicitudes.estado, "respondida")),
      db.select({ count: count() }).from(solicitudes).where(eq(solicitudes.estado, "rechazada")),
      db
        .select({
          operador: solicitudes.operador,
          total: count(),
        })
        .from(solicitudes)
        .groupBy(solicitudes.operador),
      db
        .select()
        .from(solicitudes)
        .orderBy(desc(solicitudes.updatedAt))
        .limit(10),
    ]);

    return {
      totalSolicitudes: totalSolicitudes[0].count,
      pendientes: pendientes[0].count,
      enviadas: enviadas[0].count,
      respondidas: respondidas[0].count,
      rechazadas: rechazadas[0].count,
      solicitudesPorOperador: solicitudesPorOperador,
      actividadReciente: actividadReciente,
    };
  }

  async getDashboardStatsByUser(userId: number): Promise<{
    totalSolicitudes: number;
    pendientes: number;
    enviadas: number;
    respondidas: number;
    rechazadas: number;
    solicitudesPorOperador: { operador: string; total: number }[];
    actividadReciente: any[];
  }> {
    const [
      totalSolicitudes,
      pendientes,
      enviadas,
      respondidas,
      rechazadas,
      solicitudesPorOperador,
      actividadReciente,
    ] = await Promise.all([
      db.select({ count: count() }).from(solicitudes).where(eq(solicitudes.usuarioId, userId)),
      db.select({ count: count() }).from(solicitudes).where(and(eq(solicitudes.usuarioId, userId), eq(solicitudes.estado, "procesando"))),
      db.select({ count: count() }).from(solicitudes).where(and(eq(solicitudes.usuarioId, userId), eq(solicitudes.estado, "enviada"))),
      db.select({ count: count() }).from(solicitudes).where(and(eq(solicitudes.usuarioId, userId), eq(solicitudes.estado, "respondida"))),
      db.select({ count: count() }).from(solicitudes).where(and(eq(solicitudes.usuarioId, userId), eq(solicitudes.estado, "rechazada"))),
      db
        .select({
          operador: solicitudes.operador,
          total: count(),
        })
        .from(solicitudes)
        .where(eq(solicitudes.usuarioId, userId))
        .groupBy(solicitudes.operador),
      db
        .select()
        .from(solicitudes)
        .where(eq(solicitudes.usuarioId, userId))
        .orderBy(desc(solicitudes.updatedAt))
        .limit(10),
    ]);

    return {
      totalSolicitudes: totalSolicitudes[0].count,
      pendientes: pendientes[0].count,
      enviadas: enviadas[0].count,
      respondidas: respondidas[0].count,
      rechazadas: rechazadas[0].count,
      solicitudesPorOperador: solicitudesPorOperador,
      actividadReciente: actividadReciente,
    };
  }



  async getSolicitudesByUser(userId: number, filters?: {
    operador?: string;
    estado?: string;
    tipoExperticia?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ solicitudes: Solicitud[]; total: number }> {
    try {
      const page = Math.max(1, filters?.page || 1);
      const limit = Math.min(100, Math.max(1, filters?.limit || 10));
      const offset = (page - 1) * limit;

      let whereConditions: any[] = [eq(solicitudes.usuarioId, userId)];

      if (filters?.operador && filters.operador.trim()) {
        whereConditions.push(eq(solicitudes.operador, filters.operador as any));
      }

      if (filters?.estado && filters.estado.trim()) {
        whereConditions.push(eq(solicitudes.estado, filters.estado as any));
      }

      if (filters?.tipoExperticia && filters.tipoExperticia.trim()) {
        whereConditions.push(eq(solicitudes.tipoExperticia, filters.tipoExperticia as any));
      }

      if (filters?.search && filters.search.trim()) {
        const searchTerm = `%${filters.search.trim()}%`;
        whereConditions.push(
          or(
            like(solicitudes.numeroSolicitud, searchTerm),
            like(solicitudes.numeroExpediente, searchTerm),
            like(solicitudes.fiscal, searchTerm)
          )
        );
      }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    const [solicitudesResult, totalResult] = await Promise.all([
      db
        .select()
        .from(solicitudes)
        .where(whereClause)
        .orderBy(desc(solicitudes.fechaSolicitud))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: count() })
        .from(solicitudes)
        .where(whereClause)
    ]);

      return {
        solicitudes: solicitudesResult,
        total: totalResult[0]?.count || 0,
      };
    } catch (error) {
      console.error('Error in getSolicitudesByUser:', error);
      throw error;
    }
  }



  // Notificaciones
  async createNotificacion(userId: number, solicitudId: number | null, mensaje: string): Promise<void> {
    await db.insert(notificaciones).values({
      usuarioId: userId,
      solicitudId: solicitudId,
      mensaje: mensaje,
      leida: false,
    });
  }

  async getNotificacionesByUser(userId: number): Promise<any[]> {
    const result = await db
      .select({
        id: notificaciones.id,
        mensaje: notificaciones.mensaje,
        leida: notificaciones.leida,
        createdAt: notificaciones.createdAt,
        solicitudId: notificaciones.solicitudId,
        numeroSolicitud: solicitudes.numeroSolicitud,
        estado: solicitudes.estado,
      })
      .from(notificaciones)
      .leftJoin(solicitudes, eq(notificaciones.solicitudId, solicitudes.id))
      .where(eq(notificaciones.usuarioId, userId))
      .orderBy(desc(notificaciones.createdAt));
    
    return result;
  }

  async markNotificacionAsRead(notificationId: number): Promise<void> {
    await db
      .update(notificaciones)
      .set({ leida: true })
      .where(eq(notificaciones.id, notificationId));
  }

  async getUnreadNotificationsCount(userId: number): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(notificaciones)
      .where(and(eq(notificaciones.usuarioId, userId), eq(notificaciones.leida, false)));
    
    return result[0]?.count || 0;
  }

  // Cleanup old notifications
  async cleanupOldNotifications(): Promise<void> {
    try {
      const now = new Date();
      
      // Get admin user IDs first to optimize the queries
      const adminUsers = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.rol, 'admin'));
      
      const adminIds = adminUsers.map(user => user.id);

      // For admin users: delete notifications older than 120 hours (5 days)
      const adminTimeLimit = new Date(now.getTime() - (120 * 60 * 60 * 1000));
      if (adminIds.length > 0) {
        const adminDeleted = await db
          .delete(notificaciones)
          .where(
            and(
              lt(notificaciones.createdAt, adminTimeLimit),
              inArray(notificaciones.usuarioId, adminIds)
            )
          );
        console.log(`Deleted ${adminDeleted.rowCount || 0} old admin notifications`);
      }

      // For non-admin users: delete notifications older than 48 hours
      const userTimeLimit = new Date(now.getTime() - (48 * 60 * 60 * 1000));
      const userDeleted = await db
        .delete(notificaciones)
        .where(
          and(
            lt(notificaciones.createdAt, userTimeLimit),
            ...(adminIds.length > 0 ? [notInArray(notificaciones.usuarioId, adminIds)] : [])
          )
        );
      console.log(`Deleted ${userDeleted.rowCount || 0} old user notifications`);
    } catch (error) {
      console.error('Error in cleanupOldNotifications:', error);
      throw error;
    }
  }

  // Failed login attempts and suspension management
  async incrementFailedAttempts(username: string): Promise<void> {
    try {
      await db
        .update(users)
        .set({ 
          intentosFallidos: sql`${users.intentosFallidos} + 1`,
          ultimoIntentoFallido: new Date()
        })
        .where(eq(users.username, username));
    } catch (error) {
      console.error('Error in incrementFailedAttempts:', error);
      throw error;
    }
  }

  async resetFailedAttempts(username: string): Promise<void> {
    try {
      await db
        .update(users)
        .set({ 
          intentosFallidos: 0,
          ultimoIntentoFallido: null
        })
        .where(eq(users.username, username));
    } catch (error) {
      console.error('Error in resetFailedAttempts:', error);
      throw error;
    }
  }

  async checkAndSuspendUser(username: string): Promise<boolean> {
    try {
      const user = await this.getUserByUsername(username);
      if (!user) return false;

      if ((user.intentosFallidos ?? 0) >= 2) { // 3 attempts total (0, 1, 2 = 3 attempts)
        const suspensionEnd = new Date();
        suspensionEnd.setHours(suspensionEnd.getHours() + 3); // 3 horas de suspensión

        await db
          .update(users)
          .set({ 
            status: 'suspendido',
            fechaSuspension: new Date(),
            tiempoSuspension: suspensionEnd,
            motivoSuspension: 'Múltiples intentos fallidos de acceso (3 intentos)',
            intentosFallidos: 0
          })
          .where(eq(users.username, username));

        return true;
      }
      return false;
    } catch (error) {
      console.error('Error in checkAndSuspendUser:', error);
      throw error;
    }
  }

  async checkSuspensionExpired(userId: number): Promise<boolean> {
    try {
      const user = await this.getUser(userId);
      if (!user) return false;

      if (user.status === 'suspendido' && user.tiempoSuspension) {
        const now = new Date();
        if (now >= user.tiempoSuspension) {
          // Levantar suspensión
          await db
            .update(users)
            .set({ 
              status: 'activo',
              fechaSuspension: null,
              tiempoSuspension: null,
              motivoSuspension: null
            })
            .where(eq(users.id, userId));

          // Notificar al usuario que se levantó la suspensión
          await this.notifyUserSuspensionLifted(userId);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error in checkSuspensionExpired:', error);
      throw error;
    }
  }

  // Enhanced notification methods
  async notifyAdminsOfSentRequest(solicitudId: number, numeroSolicitud: string): Promise<void> {
    // Get all admin users
    const admins = await db
      .select()
      .from(users)
      .where(eq(users.rol, 'admin'));

    // Send notification to each admin
    for (const admin of admins) {
      await this.createNotificacion(
        admin.id,
        solicitudId,
        `Nueva solicitud enviada: ${numeroSolicitud} ha sido enviada al operador`
      );
    }
  }

  async notifyUserSuspensionLifted(userId: number): Promise<void> {
    const user = await this.getUser(userId);
    if (!user) return;

    // Notify the user
    await this.createNotificacion(
      userId,
      null, // No solicitud asociada
      `Tu cuenta ha sido reactivada. La suspensión temporal ha sido levantada.`
    );

    // Notify admins
    const admins = await db
      .select()
      .from(users)
      .where(eq(users.rol, 'admin'));

    for (const admin of admins) {
      await this.createNotificacion(
        admin.id,
        null,
        `Suspensión levantada: La cuenta de ${user.nombre} (${user.username}) ha sido reactivada automáticamente`
      );
    }
  }

  async notifyAdminsOfFailedLoginSuspension(username: string, ip: string): Promise<void> {
    const user = await this.getUserByUsername(username);
    if (!user) return;

    // Notify all admins about the suspension
    const admins = await db
      .select()
      .from(users)
      .where(eq(users.rol, 'admin'));

    for (const admin of admins) {
      await this.createNotificacion(
        admin.id,
        null,
        `Cuenta suspendida por seguridad: ${user.nombre} (${username}) desde IP ${ip} por múltiples intentos fallidos`
      );
    }
  }
  // Session management methods
  async setUserSession(userId: number, sessionToken: string, expiresAt: Date): Promise<void> {
    await db
      .update(users)
      .set({ 
        sessionToken: sessionToken,
        sessionExpires: expiresAt
      })
      .where(eq(users.id, userId));
  }

  async clearUserSession(userId: number): Promise<void> {
    await db
      .update(users)
      .set({ 
        sessionToken: null,
        sessionExpires: null
      })
      .where(eq(users.id, userId));
  }

  async getUserBySessionToken(sessionToken: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.sessionToken, sessionToken));
    return user || undefined;
  }

  async isSessionActive(userId: number): Promise<boolean> {
    const [user] = await db
      .select({ sessionToken: users.sessionToken, sessionExpires: users.sessionExpires })
      .from(users)
      .where(eq(users.id, userId));
    
    if (!user || !user.sessionToken || !user.sessionExpires) {
      return false;
    }
    
    const now = new Date();
    return now < user.sessionExpires;
  }

  // Plantillas Word methods
  async getPlantillasWord(tipoExperticia?: string): Promise<PlantillaWord[]> {
    if (tipoExperticia) {
      return await db.select().from(plantillasWord).where(eq(plantillasWord.tipoExperticia, tipoExperticia as any));
    }
    
    return await db.select().from(plantillasWord);
  }

  async getPlantillaWordById(id: number): Promise<PlantillaWord | undefined> {
    const [plantilla] = await db
      .select()
      .from(plantillasWord)
      .where(eq(plantillasWord.id, id));
    return plantilla || undefined;
  }

  async getPlantillaWordByTipoExperticia(tipoExperticia: string): Promise<PlantillaWord | undefined> {
    const [plantilla] = await db
      .select()
      .from(plantillasWord)
      .where(eq(plantillasWord.tipoExperticia, tipoExperticia as any));
    return plantilla || undefined;
  }

  async createPlantillaWord(plantilla: InsertPlantillaWord): Promise<PlantillaWord> {
    const [newPlantilla] = await db
      .insert(plantillasWord)
      .values(plantilla)
      .returning();
    return newPlantilla;
  }

  async updatePlantillaWord(id: number, plantilla: Partial<InsertPlantillaWord>): Promise<PlantillaWord | undefined> {
    const [updatedPlantilla] = await db
      .update(plantillasWord)
      .set({ ...plantilla, updatedAt: new Date() })
      .where(eq(plantillasWord.id, id))
      .returning();
    return updatedPlantilla || undefined;
  }

  async deletePlantillaWord(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(plantillasWord)
        .where(eq(plantillasWord.id, id));
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error('Error deleting plantilla word:', error);
      return false;
    }
  }
}

export const storage = new DatabaseStorage();
