import {
  users,
  solicitudes,
  plantillasCorreo,
  historialSolicitudes,
  type User,
  type InsertUser,
  type Solicitud,
  type InsertSolicitud,
  type PlantillaCorreo,
  type InsertPlantillaCorreo,
  type HistorialSolicitud,
  type InsertHistorialSolicitud,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, like, count, sql } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserLastAccess(id: number): Promise<void>;

  // Solicitudes
  getSolicitudes(filters?: {
    operador?: string;
    estado?: string;
    tipoExperticia?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ solicitudes: Solicitud[]; total: number }>;
  getSolicitudById(id: number): Promise<Solicitud | undefined>;
  createSolicitud(solicitud: InsertSolicitud): Promise<Solicitud>;
  updateSolicitud(id: number, solicitud: Partial<InsertSolicitud>): Promise<Solicitud | undefined>;
  deleteSolicitud(id: number): Promise<boolean>;

  // Plantillas de correo
  getPlantillasCorreo(usuarioId?: number): Promise<PlantillaCorreo[]>;
  getPlantillaCorreoById(id: number): Promise<PlantillaCorreo | undefined>;
  createPlantillaCorreo(plantilla: InsertPlantillaCorreo): Promise<PlantillaCorreo>;
  updatePlantillaCorreo(id: number, plantilla: Partial<InsertPlantillaCorreo>): Promise<PlantillaCorreo | undefined>;
  deletePlantillaCorreo(id: number): Promise<boolean>;

  // Historial
  createHistorial(historial: InsertHistorialSolicitud): Promise<HistorialSolicitud>;
  getHistorialBySolicitud(solicitudId: number): Promise<HistorialSolicitud[]>;

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

  async updateUserLastAccess(id: number): Promise<void> {
    await db
      .update(users)
      .set({ ultimoAcceso: new Date() })
      .where(eq(users.id, id));
  }

  async getSolicitudes(filters?: {
    operador?: string;
    estado?: string;
    tipoExperticia?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ solicitudes: Solicitud[]; total: number }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const offset = (page - 1) * limit;

    let whereConditions: any[] = [];

    if (filters?.operador) {
      whereConditions.push(eq(solicitudes.operador, filters.operador as any));
    }

    if (filters?.estado) {
      whereConditions.push(eq(solicitudes.estado, filters.estado as any));
    }

    if (filters?.tipoExperticia) {
      whereConditions.push(eq(solicitudes.tipoExperticia, filters.tipoExperticia as any));
    }

    if (filters?.search) {
      whereConditions.push(
        or(
          like(solicitudes.numeroSolicitud, `%${filters.search}%`),
          like(solicitudes.numeroExpediente, `%${filters.search}%`),
          like(solicitudes.fiscal, `%${filters.search}%`)
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
      total: totalResult[0].count,
    };
  }

  async getSolicitudById(id: number): Promise<Solicitud | undefined> {
    const [solicitud] = await db.select().from(solicitudes).where(eq(solicitudes.id, id));
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
    const result = await db.delete(solicitudes).where(eq(solicitudes.id, id));
    return result.rowCount > 0;
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
    return result.rowCount > 0;
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
      db.select({ count: count() }).from(solicitudes).where(eq(solicitudes.estado, "pendiente")),
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
}

export const storage = new DatabaseStorage();
