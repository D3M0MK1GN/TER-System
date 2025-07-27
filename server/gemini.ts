import * as fs from "fs";
import { GoogleGenAI } from "@google/genai";

// Initialize Gemini AI
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function processTextMessage(message: string): Promise<string> {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: message,
        });

        return response.text || "Lo siento, no pude procesar tu mensaje.";
    } catch (error) {
        console.error("Error processing text message:", error);
        throw new Error("Error al procesar el mensaje de texto");
    }
}

export async function processFileMessage(
    message: string,
    filePath: string,
    mimeType: string
): Promise<string> {
    try {
        const fileBytes = fs.readFileSync(filePath);
        const base64Data = fileBytes.toString("base64");

        const contents = [
            {
                inlineData: {
                    data: base64Data,
                    mimeType: mimeType,
                },
            },
            message || "Analiza este archivo y proporciona un resumen detallado.",
        ];

        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            contents: contents,
        });

        return response.text || "No pude analizar el archivo proporcionado.";
    } catch (error) {
        console.error("Error processing file message:", error);
        throw new Error("Error al procesar el archivo");
    }
}

export function getSupportedMimeTypes(): Record<string, string> {
    return {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.pdf': 'application/pdf',
        '.txt': 'text/plain',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.doc': 'application/msword'
    };
}

export function isSupportedFileType(filename: string): boolean {
    const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    return Object.keys(getSupportedMimeTypes()).includes(ext);
}

export function getMimeType(filename: string): string | null {
    const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    return getSupportedMimeTypes()[ext] || null;
}