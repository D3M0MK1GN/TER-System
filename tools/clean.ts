/**
 * 🧹 HERRAMIENTA DE LIMPIEZA DE TOKENS DE SESIÓN
 * 
 * Este archivo contiene toda la lógica para limpiar tokens de sesión expirados
 * y optimizar el conteo de usuarios activos en el sistema TER-System.
 * 
 * Funcionalidades implementadas:
 * - Limpieza automática de tokens expirados cada hora
 * - Conteo optimizado de usuarios activos con sesiones válidas  
 * - Proceso de fondo con manejo de errores y logs informativos
 * - Gestión de shutdown limpio de intervalos
 */

import { db } from '../server/db';
import { users } from '../shared/schema';
import { eq, and, isNotNull, sql, count } from 'drizzle-orm';

// ===============================================
// 📊 CONTEO OPTIMIZADO DE USUARIOS ACTIVOS
// ===============================================

/**
 * Cuenta usuarios activos con sesiones válidas (optimizada)
 * Solo cuenta usuarios que tienen sessionToken y sessionExpires válidos
 * 
 * @returns Promise<number> Número de usuarios con sesiones activas
 */
export async function getActiveUsersCount(): Promise<number> {
  try {
    const now = new Date();
    
    // Consulta optimizada: usa índices y condiciones más eficientes
    const activeUsersResult = await db
      .select({ count: count() })
      .from(users)
      .where(
        and(
          eq(users.activo, true),
          eq(users.status, "activo"),
          isNotNull(users.sessionToken),
          isNotNull(users.sessionExpires),
          sql`${users.sessionExpires} > ${now}`
        )
      );
    
    return activeUsersResult[0]?.count || 0;
  } catch (error) {
    console.error('❌ Error getting active users count:', error);
    return 0;
  }
}

// ===============================================
// 🧹 LIMPIEZA DE TOKENS EXPIRADOS
// ===============================================

/**
 * Limpia tokens de sesión expirados de la base de datos
 * Mejora el rendimiento eliminando registros innecesarios
 * 
 * @returns Promise<number> Número de tokens limpiados
 */
export async function cleanupExpiredTokens(): Promise<number> {
  try {
    const now = new Date();
    
    // Primero contamos cuántos tokens expirados hay antes de limpiar
    const expiredTokensCount = await db
      .select({ count: count() })
      .from(users)
      .where(
        and(
          isNotNull(users.sessionToken),
          isNotNull(users.sessionExpires),
          sql`${users.sessionExpires} <= ${now}` // Tokens ya expirados
        )
      );
    
    const cleanedCount = expiredTokensCount[0]?.count || 0;
    
    if (cleanedCount > 0) {
      // Actualiza todos los usuarios con tokens expirados
      // Pone sessionToken = null y sessionExpires = null
      await db
        .update(users)
        .set({ 
          sessionToken: null, 
          sessionExpires: null 
        })
        .where(
          and(
            isNotNull(users.sessionToken),
            isNotNull(users.sessionExpires),
            sql`${users.sessionExpires} <= ${now}` // Tokens ya expirados
          )
        );
      
      console.log(`🧹 Limpieza de tokens: ${cleanedCount} tokens expirados eliminados`);
    }
    
    return cleanedCount;
  } catch (error) {
    console.error('❌ Error limpiando tokens expirados:', error);
    return 0;
  }
}


/**
 * Inicia el proceso automático de limpieza de tokens cada hora
 * 
 * @returns NodeJS.Timeout El interval para poder cancelarlo después
 */
export function startTokenCleanupProcess(): NodeJS.Timeout {
  console.log('🚀 Iniciando proceso automático de limpieza de tokens (cada hora)');
  
  // 🆕 Background task to clean up expired session tokens every hour
  // Mejora el rendimiento eliminando tokens innecesarios de la base de datos
  const tokenCleanupInterval = setInterval(async () => {
    try {
      const cleanedTokens = await cleanupExpiredTokens();
      // Log solo si se limpiaron tokens para evitar spam en logs
      if (cleanedTokens > 0) {
        console.log(`⏰ Limpieza automática: ${cleanedTokens} tokens expirados eliminados`);
      }
    } catch (error) {
      // Error cleaning up expired tokens - background task continues
      console.error('❌ Error en limpieza automática de tokens:', error);
    }
  }, 60 * 60 * 1000); // 1 hour (3600000 ms)
  
  return tokenCleanupInterval;
}

/**
 * Detiene el proceso automático de limpieza
 * 
 * @param interval El interval a cancelar
 */
export function stopTokenCleanupProcess(interval: NodeJS.Timeout): void {
  clearInterval(interval);
  console.log('🛑 Proceso de limpieza automática detenido');
}

// ===============================================
// 🔧 GESTIÓN COMPLETA DE PROCESOS
// ===============================================

/**
 * Configuración completa del sistema de limpieza con gestión de shutdown
 * Incluye todos los procesos de fondo y limpieza al cerrar
 */
export class TokenCleanupManager {
  private tokenCleanupInterval: NodeJS.Timeout | null = null;
  private isRunning = false;
  
  /**
   * Inicia todos los procesos de limpieza
   */
  start(): void {
    if (this.isRunning) {
      console.log('⚠️ El proceso de limpieza ya está ejecutándose');
      return;
    }
    
    this.tokenCleanupInterval = this.startTokenCleanupProcess();
    this.setupShutdownHandlers();
    this.isRunning = true;
    
    console.log('✅ TokenCleanupManager iniciado correctamente');
  }
  
  /**
   * Detiene todos los procesos de limpieza
   */
  stop(): void {
    if (this.tokenCleanupInterval) {
      clearInterval(this.tokenCleanupInterval);
      this.tokenCleanupInterval = null;
    }
    
    this.isRunning = false;
    console.log('🛑 TokenCleanupManager detenido');
  }
  
  /**
   * Inicia el proceso automático de limpieza
   */
  private startTokenCleanupProcess(): NodeJS.Timeout {
    console.log('🚀 Iniciando proceso automático de limpieza de tokens (cada hora)');
    
    return setInterval(async () => {
      try {
        const cleanedTokens = await cleanupExpiredTokens();
        if (cleanedTokens > 0) {
          console.log(`⏰ Limpieza automática: ${cleanedTokens} tokens expirados eliminados`);
        }
      } catch (error) {
        console.error('❌ Error en limpieza automática de tokens:', error);
      }
    }, 60 * 60 * 1000); // 1 hour
  }
  
  /**
   * Configura los handlers para cerrar limpiamente al shutdown
   */
  private setupShutdownHandlers(): void {
    // Cleanup intervals on server shutdown
    // 🔧 Agregamos el nuevo interval a la limpieza de shutdown
    const shutdownHandler = () => {
      console.log('🔄 Cerrando procesos de limpieza...');
      this.stop();
    };
    
    process.on('SIGTERM', shutdownHandler);
    process.on('SIGINT', shutdownHandler);
  }
  
  /**
   * Ejecuta una limpieza manual inmediata
   */
  async runManualCleanup(): Promise<number> {
    console.log('🔧 Ejecutando limpieza manual de tokens...');
    const cleaned = await cleanupExpiredTokens();
    console.log(`✅ Limpieza manual completada: ${cleaned} tokens eliminados`);
    return cleaned;
  }
  
  /**
   * Obtiene estadísticas del sistema de limpieza
   */
  getStatus(): { isRunning: boolean; nextCleanupIn: string } {
    return {
      isRunning: this.isRunning,
      nextCleanupIn: this.isRunning ? 'Cada hora' : 'Detenido'
    };
  }
}

// ===============================================
// 📋 EXPORTACIONES PRINCIPALES
// ===============================================

// Funciones individuales
export {
  getActiveUsersCount,
  cleanupExpiredTokens,
  startTokenCleanupProcess,
  stopTokenCleanupProcess
};

// Instancia singleton del manager
export const tokenCleanupManager = new TokenCleanupManager();
