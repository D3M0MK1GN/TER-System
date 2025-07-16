import { pgTable, text, serial, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  nombre: text("nombre").notNull(),
  email: text("email"),
  rol: text("rol").default("usuario"),
  activo: boolean("activo").default(true),
  ultimoAcceso: timestamp("ultimo_acceso"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const operadorEnum = pgEnum("operador", ["movistar", "claro", "entel", "bitel", "otros"]);
export const estadoEnum = pgEnum("estado", ["pendiente", "enviada", "respondida", "rechazada"]);
export const tipoExperticicaEnum = pgEnum("tipo_experticia", [
  "analisis_radioespectro",
  "identificacion_bts",
  "analisis_trafico",
  "localizacion_antenas",
  "analisis_cobertura",
  "otros"
]);
export const coordinacionEnum = pgEnum("coordinacion", [
  "delitos_propiedad",
  "delitos_personas",
  "crimen_organizado",
  "ciberdelitos",
  "otros"
]);

export const solicitudes = pgTable("solicitudes", {
  id: serial("id").primaryKey(),
  numeroSolicitud: text("numero_solicitud").notNull(),
  numeroExpediente: text("numero_expediente").notNull(),
  fiscal: text("fiscal"),
  tipoExperticia: tipoExperticicaEnum("tipo_experticia").notNull(),
  coordinacionSolicitante: coordinacionEnum("coordinacion_solicitante").notNull(),
  operador: operadorEnum("operador").notNull(),
  informacionLinea: text("informacion_linea"),
  descripcion: text("descripcion"),
  estado: estadoEnum("estado").default("pendiente"),
  fechaSolicitud: timestamp("fecha_solicitud").defaultNow(),
  fechaRespuesta: timestamp("fecha_respuesta"),
  oficio: text("oficio"),
  usuarioId: integer("usuario_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const plantillasCorreo = pgTable("plantillas_correo", {
  id: serial("id").primaryKey(),
  nombre: text("nombre").notNull(),
  operador: operadorEnum("operador").notNull(),
  asunto: text("asunto").notNull(),
  cuerpo: text("cuerpo").notNull(),
  usuarioId: integer("usuario_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const historialSolicitudes = pgTable("historial_solicitudes", {
  id: serial("id").primaryKey(),
  solicitudId: integer("solicitud_id").references(() => solicitudes.id),
  accion: text("accion").notNull(),
  descripcion: text("descripcion"),
  usuarioId: integer("usuario_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  solicitudes: many(solicitudes),
  plantillasCorreo: many(plantillasCorreo),
  historialSolicitudes: many(historialSolicitudes),
}));

export const solicitudesRelations = relations(solicitudes, ({ one, many }) => ({
  usuario: one(users, {
    fields: [solicitudes.usuarioId],
    references: [users.id],
  }),
  historial: many(historialSolicitudes),
}));

export const plantillasCorreoRelations = relations(plantillasCorreo, ({ one }) => ({
  usuario: one(users, {
    fields: [plantillasCorreo.usuarioId],
    references: [users.id],
  }),
}));

export const historialSolicitudesRelations = relations(historialSolicitudes, ({ one }) => ({
  solicitud: one(solicitudes, {
    fields: [historialSolicitudes.solicitudId],
    references: [solicitudes.id],
  }),
  usuario: one(users, {
    fields: [historialSolicitudes.usuarioId],
    references: [users.id],
  }),
}));

// Schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  ultimoAcceso: true,
});

export const insertSolicitudSchema = createInsertSchema(solicitudes).omit({
  id: true,
  fechaSolicitud: true,
  fechaRespuesta: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPlantillaCorreoSchema = createInsertSchema(plantillasCorreo).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertHistorialSchema = createInsertSchema(historialSolicitudes).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Solicitud = typeof solicitudes.$inferSelect;
export type InsertSolicitud = z.infer<typeof insertSolicitudSchema>;
export type PlantillaCorreo = typeof plantillasCorreo.$inferSelect;
export type InsertPlantillaCorreo = z.infer<typeof insertPlantillaCorreoSchema>;
export type HistorialSolicitud = typeof historialSolicitudes.$inferSelect;
export type InsertHistorialSolicitud = z.infer<typeof insertHistorialSchema>;

// Auth schemas
export const loginSchema = z.object({
  username: z.string().min(1, "Usuario es requerido"),
  password: z.string().min(1, "Contraseña es requerida"),
});

export type LoginData = z.infer<typeof loginSchema>;
