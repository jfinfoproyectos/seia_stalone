'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

// Helper local para obtener usuario
async function getCurrentUser() {
    const session = await auth();
    if (!session?.user?.id) return null;
    return { id: session.user.id };
}

/**
 * Guarda la API Key de Gemini para el usuario actual.
 * @param apiKey - La API Key a guardar.
 */
export async function saveGeminiApiKey(apiKey: string) {
    try {
        const user = await getCurrentUser();

        if (!user) {
            return { success: false, error: "Usuario no autenticado" };
        }

        // Validar formato básico (opcional, igual que en el cliente)
        if (!apiKey || apiKey.trim().length < 10 || !apiKey.startsWith('AIza')) {
            return { success: false, error: "Formato de API Key inválido" };
        }

        await prisma.user.update({
            where: { id: parseInt(user.id) },
            data: { geminiApiKey: apiKey },
        });

        return { success: true };
    } catch (error) {
        console.error("Error al guardar la API Key:", error);
        return { success: false, error: "Error al guardar la configuración" };
    }
}

/**
 * Obtiene la API Key de Gemini del usuario actual.
 * Nota: Por seguridad, esto solo debe usarse en contextos donde el usuario
 * está autorizado a ver su propia llave (ej. configuración).
 */
export async function getGeminiApiKey() {
    try {
        const user = await getCurrentUser();

        if (!user) {
            return null;
        }

        const userData = await prisma.user.findUnique({
            where: { id: parseInt(user.id) },
            select: { geminiApiKey: true },
        });

        return userData?.geminiApiKey || null;
    } catch (error) {
        console.error("Error al obtener la API Key:", error);
        return null;
    }
}
