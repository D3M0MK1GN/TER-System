import * as fs from "fs";
import { GoogleGenAI } from "@google/genai";
/**
 * CHATBOT GEMINI AI - TER-SYSTEM
 * ==============================
 * 
 * Este módulo maneja la integración con Google Gemini AI para el chatbot del sistema TER-System.
 * Proporciona funcionalidades especializadas para análisis de telecomunicaciones.
 */

// Configuración de Google Gemini AI
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

// Constantes de configuración
const CONFIG = {
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB en bytes
    MODELS: {
        TEXT: "gemini-2.5-flash",     // Modelo rápido para texto
        FILE: "gemini-2.5-flash" // FILE: "gemini-2.5-pro" // Modelo avanzado para archivos
    }
} as const;

/**
 * Prompt especializado para el contexto de telecomunicaciones
 * Optimiza las respuestas de IA para el dominio específico del sistema TER-System
 */
const TELECOM_CONTEXT = `Eres un asistente especializado en telecomunicaciones tu nombre es Daemon. 
Enfócate en: análisis de redes, BTS/radioespectro, operadores venezolanos (Digitel/Movistar/Movilnet), 
análisis forense de informatica, comunicaciones y experticia técnica. Responde de manera clara y práctica y sencilla.`;

/**
 * PROCESAMIENTO DE MENSAJES DE TEXTO
 * ==================================
 * 
 * Procesa consultas de texto del usuario utilizando Gemini 2.5 Flash
 * Aplica contexto especializado en telecomunicaciones
 * 
 * @param message - Mensaje del usuario
 * @returns Respuesta procesada por IA
 */
export async function processTextMessage(message: string): Promise<string> {
    try {
        const response = await ai.models.generateContent({
            model: CONFIG.MODELS.TEXT,
            contents: `${TELECOM_CONTEXT}\n\nConsulta: ${message}`,
        });

        return response.text || "Lo siento, no pude procesar tu mensaje.";
    } catch (error) {
        console.error("Error processing text message:", error);
        throw new Error("Error al procesar el mensaje de texto");
    }
}
/**
 * PROCESAMIENTO DE ARCHIVOS CON IA
 * ================================
 * 
 * Analiza archivos adjuntos (imágenes, documentos) utilizando Gemini 2.5 Pro
 * Incluye validación de tamaño y lectura asíncrona optimizada
 * 
 * @param message - Mensaje opcional del usuario
 * @param filePath - Ruta del archivo a procesar
 * @param mimeType - Tipo MIME del archivo
 * @returns Análisis del archivo por IA
 */
export async function processFileMessage(
    message: string,
    filePath: string,
    mimeType: string
): Promise<string> {
    try {
        // Validación de tamaño del archivo antes de procesarlo
        const { size } = await fs.promises.stat(filePath);
        if (size > CONFIG.MAX_FILE_SIZE) {
            throw new Error(`Archivo demasiado grande. Máximo: ${CONFIG.MAX_FILE_SIZE / (1024 * 1024)}MB`);
        }

        // Lectura asíncrona optimizada del archivo
        const fileData = (await fs.promises.readFile(filePath)).toString("base64");
        
        // Prompt especializado para análisis de archivos
        const analysisPrompt = message || `${TELECOM_CONTEXT}
        
Analiza este archivo para telecomunicaciones:
- Resumen del contenido
- Relevancia técnica
- Aplicaciones en experticia
- Datos importantes identificados`;

        const response = await ai.models.generateContent({
            model: CONFIG.MODELS.FILE,
            contents: [
                { inlineData: { data: fileData, mimeType } },
                analysisPrompt
            ],
        });

        return response.text || "No pude analizar el archivo proporcionado.";
    } catch (error) {
        console.error("Error processing file message:", error);
        throw new Error("Error al procesar el archivo");
    }
}

/**
 * UTILIDADES DE VALIDACIÓN DE ARCHIVOS
 * ====================================
 * 
 * Funciones para validar tipos de archivo soportados y tamaños
 * Optimizadas para el contexto del chatbot TER-System
 */

// Tipos de archivo soportados por el chatbot
const SUPPORTED_TYPES = {
    '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
    '.gif': 'image/gif', '.webp': 'image/webp', '.pdf': 'application/pdf',
    '.txt': 'text/plain', '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.doc': 'application/msword'
} as const;

/**
 * Obtiene todos los tipos MIME soportados
 */
export const getSupportedMimeTypes = () => ({ ...SUPPORTED_TYPES });

/**
 * Valida si un archivo es de tipo soportado
 */
export const isSupportedFileType = (filename: string): boolean => {
    if (!filename) return false;
    const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    return ext in SUPPORTED_TYPES;
};

/**
 * Obtiene el tipo MIME de un archivo por su nombre
 */
export const getMimeType = (filename: string): string | null => {
    if (!filename) return null;
    const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    return SUPPORTED_TYPES[ext as keyof typeof SUPPORTED_TYPES] || null;
};

/**
 * VALIDACIÓN COMPLETA DE ARCHIVOS
 * ===============================
 * 
 * Valida nombre, tipo y tamaño de archivo antes del procesamiento
 * 
 * @param filename - Nombre del archivo
 * @param fileSize - Tamaño del archivo en bytes (opcional)
 * @returns Resultado de validación con error si aplica
 */
export function validateFile(filename: string, fileSize?: number): { valid: boolean; error?: string } {
    if (!filename) return { valid: false, error: "Nombre de archivo requerido" };
    
    if (!isSupportedFileType(filename)) {
        return { 
            valid: false, 
            error: `Formato no soportado. Permitidos: ${Object.keys(SUPPORTED_TYPES).join(', ')}` 
        };
    }
    
    if (fileSize && fileSize > CONFIG.MAX_FILE_SIZE) {
        return { 
            valid: false, 
            error: `Archivo muy grande. Máximo: ${CONFIG.MAX_FILE_SIZE / (1024 * 1024)}MB` 
        };
    }

    return { valid: true };
}