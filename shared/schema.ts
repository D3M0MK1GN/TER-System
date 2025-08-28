import { pgTable, text, serial, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const statusEnum = pgEnum("status", ["activo", "suspendido", "bloqueado"]);

export const delegacionEnum = pgEnum("delegacion", [
  "delegacion_municipal_quibor",
  "delegacion_municipal_barquisimeto", 
  "delegacion_municipal_san_juan",
  "delegacion_municipal_tocuyo",
  "delegacion_municipal_cabudare",
  "delegacion_municipal_iribarren",
  "delegacion_municipal_palavecino",
  "delegacion_municipal_crespo",
  "delegacion_municipal_morán",
  "delegacion_municipal_simón_planas",
  "delegacion_municipal_andrés_eloy_blanco",
  "delegacion_municipal_jiménez", 
  "delegacion_municipal_torres",
  "delegacion_municipal_urdaneta",
  "delegacion_municipal_sucre",
  "delegacion_municipal_libertador",
  "delegacion_municipal_chacao",
  "delegacion_municipal_baruta",
  "delegacion_municipal_el_hatillo",
  "delegacion_municipal_maracaibo",
  "delegacion_municipal_san_francisco",
  "delegacion_municipal_cabimas",
  "delegacion_municipal_valencia",
  "delegacion_municipal_naguanagua",
  "delegacion_municipal_girardot",
  "delegacion_municipal_maracay",
  "delegacion_municipal_san_cristóbal",
  "delegacion_municipal_libertador_merida"
]);

// Esquema para la Tabla usuarios de la Base de datos
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  nombre: text("nombre").notNull(),
  email: text("email"),
  credencial: text("credencial"),
  numeroTelefonico: text("numero_telefonico"),
  rol: text("rol").default("usuario"),
  coordinacion: text("coordinacion"),
  delegacion: delegacionEnum("delegacion"),
  activo: boolean("activo").default(true),
  status: statusEnum("status").default("activo"),
  direccionIp: text("direccion_ip"),
  ultimoAcceso: timestamp("ultimo_acceso"),
  createdAt: timestamp("created_at").defaultNow(),
  fechaSuspension: timestamp("fecha_suspension"),
  tiempoSuspension: timestamp("tiempo_suspension"),
  motivoSuspension: text("motivo_suspension"),
  intentosFallidos: integer("intentos_fallidos").default(0),
  ultimoIntentoFallido: timestamp("ultimo_intento_fallido"),
  sessionToken: text("session_token"), // Para gestión de sesiones únicas
  sessionExpires: timestamp("session_expires"), // Expiración
  // 
  //  de sesión
  // Campos para control del chatbot
  chatbotHabilitado: boolean("chatbot_habilitado").default(true),
  chatbotLimiteMensajes: integer("chatbot_limite_mensajes").default(20),
  chatbotMensajesUsados: integer("chatbot_mensajes_usados").default(0),
  chatbotReseteoMensajes: timestamp("chatbot_reseteo_mensajes").defaultNow(),
});

export const operadorEnum = pgEnum("operador", ["digitel", "movistar", "movilnet"]);
export const estadoEnum = pgEnum("estado", ["procesando", "enviada", "respondida", "rechazada"]);
export const estadoExperticiasEnum = pgEnum("estado_experticias", ["completada", "negativa", "procesando", "qr_ausente"]);
export const tipoPlantillaWordEnum = pgEnum("tipo_plantilla_word", ["solicitud", "experticia"]);


export const solicitudes = pgTable("solicitudes", {
  id: serial("id").primaryKey(),
  numeroSolicitud: text("numero_solicitud").notNull().unique(),
  numeroExpediente: text("numero_expediente").notNull(),
  fiscal: text("fiscal"),
  tipoExperticia: text("tipo_experticia").notNull(),
  coordinacionSolicitante: text("coordinacion_solicitante").notNull(),
  operador: operadorEnum("operador").notNull(),
  informacionLinea: text("informacion_linea"), // Linea de Codigo Redundante
  direc: text("direc"),
  delito: text("delito").notNull(),
  fecha_de_solicitud: text("fecha_de_solicitud"),    
  descripcion: text("descripcion"),
  motivoRechazo: text("motivo_rechazo"),
  estado: estadoEnum("estado").default("enviada"),
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

export const notificaciones = pgTable("notificaciones", {
  id: serial("id").primaryKey(),
  usuarioId: integer("usuario_id").references(() => users.id),
  solicitudId: integer("solicitud_id").references(() => solicitudes.id),
  mensaje: text("mensaje").notNull(),
  leida: boolean("leida").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const plantillasWord = pgTable("plantillas_word", {
  id: serial("id").primaryKey(),
  nombre: text("nombre").notNull(),
  tipoExperticia: text("tipo_experticia").notNull(),
  tipoPlantilla: tipoPlantillaWordEnum("tipo_plantilla").default("solicitud"),
  archivo: text("archivo").notNull(), // Ruta del archivo o contenido base64
  nombreArchivo: text("nombre_archivo").notNull(), // Nombre original del archivo
  tamaño: integer("tamaño"), // Tamaño en bytes
  usuarioId: integer("usuario_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tabla para configuración global del sistema
export const configuracionSistema = pgTable("configuracion_sistema", {
  id: serial("id").primaryKey(),
  clave: text("clave").notNull().unique(),
  valor: text("valor").notNull(),
  descripcion: text("descripcion"),
  usuarioId: integer("usuario_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tabla para historial de mensajes del chatbot
export const chatbotMensajes = pgTable("chatbot_mensajes", {
  id: serial("id").primaryKey(),
  usuarioId: integer("usuario_id").references(() => users.id).notNull(),
  mensaje: text("mensaje").notNull(),
  respuesta: text("respuesta").notNull(),
  tieneArchivo: boolean("tiene_archivo").default(false),
  nombreArchivo: text("nombre_archivo"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const configuracionSistemaRelations = relations(configuracionSistema, ({ one }) => ({
  usuario: one(users, {
    fields: [configuracionSistema.usuarioId],
    references: [users.id],
  }),
}));

export const chatbotMensajesRelations = relations(chatbotMensajes, ({ one }) => ({
  usuario: one(users, {
    fields: [chatbotMensajes.usuarioId],
    references: [users.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  solicitudes: many(solicitudes),
  plantillasCorreo: many(plantillasCorreo),
  historialSolicitudes: many(historialSolicitudes),
  notificaciones: many(notificaciones),
  plantillasWord: many(plantillasWord),
  chatbotMensajes: many(chatbotMensajes),
  configuracionSistema: many(configuracionSistema),

}));

export const solicitudesRelations = relations(solicitudes, ({ one, many }) => ({
  usuario: one(users, {
    fields: [solicitudes.usuarioId],
    references: [users.id],
  }),
  historial: many(historialSolicitudes),
  notificaciones: many(notificaciones),
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

export const notificacionesRelations = relations(notificaciones, ({ one }) => ({
  usuario: one(users, {
    fields: [notificaciones.usuarioId],
    references: [users.id],
  }),
  solicitud: one(solicitudes, {
    fields: [notificaciones.solicitudId],
    references: [solicitudes.id],
  }),
}));

export const plantillasWordRelations = relations(plantillasWord, ({ one }) => ({
  usuario: one(users, {
    fields: [plantillasWord.usuarioId],
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
}).extend({
  numeroSolicitud: z.string()
    .min(1, "Número de solicitud es requerido")
    .max(50, "Número de solicitud muy largo")
    .transform(val => val.trim()),
  numeroExpediente: z.string()
    .min(1, "Número de expediente es requerido")
    .max(50, "Número de expediente muy largo")
    .transform(val => val.trim()),
  fiscal: z.string()
    .min(1, "Fiscal es requerido")
    .max(100, "Nombre del fiscal muy largo")
    .transform(val => val.trim()),
});

export const insertPlantillaCorreoSchema = createInsertSchema(plantillasCorreo).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPlantillaWordSchema = createInsertSchema(plantillasWord).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertHistorialSchema = createInsertSchema(historialSolicitudes).omit({
  id: true,
  createdAt: true,
});

export const insertConfiguracionSistemaSchema = createInsertSchema(configuracionSistema).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Tabla de Experticias
export const experticias = pgTable("experticias", {
  id: serial("id").primaryKey(),
  numeroDictamen: text("numero_dictamen").notNull().unique(),
  experto: text("experto").notNull(),
  numeroComunicacion: text("numero_comunicacion").notNull(),
  fechaComunicacion: text("fecha_comunicacion"),
  motivo: text("motivo").notNull(),
  operador: operadorEnum("operador").notNull(),
  fechaRespuesta: text("fecha_respuesta"),
  usoHorario: text("uso_horario"),
  archivoAdjunto: text("archivo_adjunto"), // Ruta del archivo adjunto
  tipoExperticia: text("tipo_experticia").notNull(),
  abonado: text("abonado"),
  datosAbonado: text("datos_abonado"),
  conclusion: text("conclusion"),
  expediente: text("expediente").notNull(),
  estado: estadoExperticiasEnum("estado").default("procesando"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  usuarioId: integer("usuario_id").references(() => users.id),
});

export const insertChatbotMensajeSchema = createInsertSchema(chatbotMensajes).omit({
  id: true,
  createdAt: true,
});

export const insertExperticiasSchema = createInsertSchema(experticias).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  numeroDictamen: z.string()
    .min(1, "Número de dictamen es requerido")
    .max(100, "Número de dictamen muy largo")
    .transform(val => val.trim()),
  experto: z.string()
    .min(1, "Experto es requerido")
    .max(200, "Nombre del experto muy largo")
    .transform(val => val.trim()),
  numeroComunicacion: z.string()
    .min(1, "Número de comunicación es requerido")
    .max(100, "Número de comunicación muy largo")
    .transform(val => val.trim()),
  motivo: z.string()
    .min(1, "Motivo es requerido")
    .transform(val => val.trim()),
  tipoExperticia: z.string()
    .min(1, "Tipo de experticia es requerido")
    .transform(val => val.trim()),
  expediente: z.string()
    .min(1, "Expediente es requerido")
    .max(100, "Expediente muy largo")
    .transform(val => val.trim()),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Solicitud = typeof solicitudes.$inferSelect;
export type InsertSolicitud = z.infer<typeof insertSolicitudSchema>;
export type PlantillaCorreo = typeof plantillasCorreo.$inferSelect;
export type InsertPlantillaCorreo = z.infer<typeof insertPlantillaCorreoSchema>;
export type PlantillaWord = typeof plantillasWord.$inferSelect;
export type InsertPlantillaWord = z.infer<typeof insertPlantillaWordSchema>;
export type HistorialSolicitud = typeof historialSolicitudes.$inferSelect;
export type InsertHistorialSolicitud = z.infer<typeof insertHistorialSchema>;
export type ConfiguracionSistema = typeof configuracionSistema.$inferSelect;
export type InsertConfiguracionSistema = z.infer<typeof insertConfiguracionSistemaSchema>;
export type ChatbotMensaje = typeof chatbotMensajes.$inferSelect;
export type InsertChatbotMensaje = z.infer<typeof insertChatbotMensajeSchema>;
export type Experticia = typeof experticias.$inferSelect;
export type InsertExperticia = z.infer<typeof insertExperticiasSchema>;

// Relaciones que deben ir al final
export const experticiasRelations = relations(experticias, ({ one }) => ({
  usuario: one(users, {
    fields: [experticias.usuarioId],
    references: [users.id],
  }),
}));

export const usersRelationsComplete = relations(users, ({ many }) => ({
  solicitudes: many(solicitudes),
  plantillasCorreo: many(plantillasCorreo),
  historialSolicitudes: many(historialSolicitudes),
  notificaciones: many(notificaciones),
  plantillasWord: many(plantillasWord),
  chatbotMensajes: many(chatbotMensajes),
  configuracionSistema: many(configuracionSistema),
  experticias: many(experticias),
}));

// Auth schemas
export const loginSchema = z.object({
  username: z.string().min(1, "Usuario es requerido"),
  password: z.string().min(1, "Contraseña es requerida"),
});

export type LoginData = z.infer<typeof loginSchema>;



