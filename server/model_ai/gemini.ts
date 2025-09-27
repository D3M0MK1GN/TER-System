import * as fs from "fs";
import { GoogleGenAI } from "@google/genai";
import fetch from "node-fetch";
/**
 * CHATBOT GEMINI AI - TER-SYSTEM
 * ==============================
 * 
 * Este módulo maneja la integración con Google Gemini AI para el chatbot del sistema TER-System.
 * Proporciona funcionalidades especializadas para análisis de telecomunicaciones.
 */

// Configuración de Google Gemini AI
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

// URL de la API Python para consultas OSINT
const PYTHON_API_URL = "http://localhost:5001";

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
const TELECOM_CONTEXT = `Eres un asistente especializado en telecomunicaciones y si te pregunto como te llamas o 
te pregunto tu nombre tu, respondes Me llamo Daemon estoy a su servicio y 
si te pregunto quien es tu creador o quiente programo responderas fui (palabra usada) por Raul Jimenez
Enfócate en: análisis de redes, BTS/radioespectro,análisis forense de informatica, comunicaciones y experticia técnica. Responde de manera clara y práctica.`;

"ok fijate en la seccion de gestion de expertica, especificamente en el modal que parece cuando se le da click al icono del ojito en la tabla hay quiero que se muestre la tabla con los resultado que se extrajo del archivo excel subido (antes de cambiar o modificar el codigo dime que piensas hacer y te dire si lo apruebi o no        "
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
        // Verificar si es una consulta de cédula antes de procesar con IA
        const cedulaResult = await detectAndProcessCedula(message);
        if (cedulaResult) {
            return cedulaResult;
        }

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

/**
 * FUNCIONES DE INTEGRACIÓN CON API PYTHON OSINT
 * ==============================================
 * 
 * Detecta y procesa consultas de cédulas venezolanas mediante la API Python
 */

/**
 * Detecta si un mensaje contiene una consulta de cédula venezolana
 * @param message - Mensaje del usuario
 * @returns Objeto con la información de la cédula si es detectada
 */
function detectCedulaQuery(message: string): { nacionalidad: string; cedula: string } | null {
    // Patrones para detectar cédulas venezolanas
    const patterns = [
        // Formato: V-12345678 o E-12345678
        /([VE])-?(\d{7,8})/gi,
        // Formato: V12345678 o E12345678
        /([VE])(\d{7,8})/gi,
        // Formato: cedula V 12345678
        /cedula\s+([VE])\s*-?\s*(\d{7,8})/gi,
        // Formato: consulta V-12345678
        /consulta\s+([VE])\s*-?\s*(\d{7,8})/gi,
        // Formato: buscar V12345678
        /buscar\s+([VE])\s*-?\s*(\d{7,8})/gi
    ];

    for (const pattern of patterns) {
        const match = pattern.exec(message);
        if (match) {
            return {
                nacionalidad: match[1].toUpperCase(),
                cedula: match[2]
            };
        }
    }

    return null;
}

/**
 * Procesa una consulta de cédula usando la API Python
 * @param nacionalidad - V o E
 * @param cedula - Número de cédula
 * @returns Respuesta formateada para el chatbot
 */
async function consultarCedulaAPI(nacionalidad: string, cedula: string): Promise<string> {
    try {
        const response = await fetch(`${PYTHON_API_URL}/consulta-cedula`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                nacionalidad,
                cedula
            })
        });

        if (!response.ok) {
            throw new Error(`Error de API: ${response.status}`);
        }

        const data: any = await response.json();

        if (data.success && data.data) {
            return formatCedulaResponse(data.data, nacionalidad, cedula);
        } else if (data.success === false) {
            return `❌ **Error en consulta de cédula ${nacionalidad}-${cedula}**\n\n${data.error || 'No se pudo obtener información'}`;
        } else {
            return formatCedulaResponse(data, nacionalidad, cedula);
        }

    } catch (error) {
        console.error('Error consultando cédula:', error);
        return `❌ **Error de conexión**\n\nNo se pudo conectar con el servicio de consulta de cédulas. Verifica que la API Python esté ejecutándose en el puerto 5001.`;
    }
}

/**
 * Formatea la respuesta de consulta de cédula para el chatbot
 * @param data - Datos de la API de cédula
 * @param nacionalidad - V o E
 * @param cedula - Número de cédula
 * @returns Respuesta formateada en markdown
 */
function formatCedulaResponse(data: any, nacionalidad: string, cedula: string): string {
    let response = `🔍 **Consulta de Cédula ${nacionalidad}-${cedula}**\n\n`;

    if (!data) return response + `❌ No se encontraron datos para la cédula consultada.`;

    // Extraer datos del objeto anidado
    let extractedData = data;
    if (data.data && typeof data.data === 'object') {
        extractedData = data.data;
    }

    // Campos de información personal
    const fields = [
        { keys: ['primer_nombre', 'nombre'], label: '👤 **Nombre:**' },
        { keys: ['segundo_nombre'], label: '**Segundo Nombre:**' },
        { keys: ['primer_apellido', 'apellido'], label: '**Primer Apellido:**' },
        { keys: ['segundo_apellido'], label: '**Segundo Apellido:**' },
        { keys: ['fecha_nac', 'fecha_nacimiento'], label: '📅 **Fecha de Nacimiento:**' },
        { keys: ['rif'], label: '🆔 **RIF:**' },
        { keys: ['nacionalidad'], label: '🏳️ **Nacionalidad:**' },
        { keys: ['cedula'], label: '📋 **Cédula:**' }
    ];

    let hasValidData = false;
    fields.forEach(field => {
        const value = field.keys.find(key => extractedData[key]);
        if (value && extractedData[value]) {
            response += `${field.label} ${extractedData[value]}\n`;
            hasValidData = true;
        }
    });

    if (!hasValidData) {
        response += `❌ No se pudieron extraer datos válidos de la respuesta.\n`;
    }

    response += `\n⚠️ **Importante:** Esta información es para fines de investigación autorizada únicamente.\n`;
    response += `🕒 **Consulta realizada:** ${new Date().toLocaleString('es-VE')}`;

    return response;
}

/**
 * Detecta y procesa consultas de cédula en mensajes del chatbot
 * @param message - Mensaje del usuario
 * @returns Respuesta de consulta de cédula o null si no es una consulta
 */
export async function detectAndProcessCedula(message: string): Promise<string | null> {
    const cedulaQuery = detectCedulaQuery(message);
    
    if (!cedulaQuery) {
        return null;
    }

    const { nacionalidad, cedula } = cedulaQuery;
    
    // Validar formato de cédula
    if (!['V', 'E'].includes(nacionalidad)) {
        return `❌ **Error de formato**\n\nLa nacionalidad debe ser V (venezolano) o E (extranjero)`;
    }

    if (!/^\d{7,8}$/.test(cedula)) {
        return `❌ **Error de formato**\n\nEl número de cédula debe tener entre 7 y 8 dígitos`;
    }

    return await consultarCedulaAPI(nacionalidad, cedula);
}