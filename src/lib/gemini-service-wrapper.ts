'use client';

import { getApiKey } from './apiKeyService';

/**
 * Wrapper para servicios de Gemini que facilita la migración al nuevo sistema de API keys
 * Este wrapper permite que los servicios funcionen tanto con el nuevo sistema (localStorage)
 * como durante la transición
 */

/**
 * Ejecuta una función de servicio de Gemini con la API key del usuario
 * @param serviceFunction - Función del servicio que requiere API key
 * @param args - Argumentos para la función del servicio (sin incluir la API key)
 * @returns Resultado de la función del servicio
 */
export async function withApiKey<T extends any[], R>(
  serviceFunction: (...args: [...T, string]) => Promise<R>,
  ...args: T
): Promise<R> {
  const apiKey = getApiKey();
  return serviceFunction(...args, apiKey);
}

/**
 * Hook para ejecutar servicios de Gemini de forma segura
 * Verifica que haya API key antes de ejecutar
 */
export function useGeminiService() {
  const executeService = async <T extends any[], R>(
    serviceFunction: (...args: [...T, string]) => Promise<R>,
    ...args: T
  ): Promise<R> => {
    try {
      const apiKey = getApiKey();
      return await serviceFunction(...args, apiKey);
    } catch (error) {
      if (error instanceof Error && error.message.includes('API Key de Gemini no configurada')) {
        throw new Error('Necesitas configurar tu API key de Gemini para usar esta función.');
      }
      throw error;
    }
  };

  return { executeService };
}

/**
 * Función para verificar si hay API key disponible
 */
export function checkApiKeyAvailable(): boolean {
  try {
    getApiKey();
    return true;
  } catch (error) {
    return false;
  }
}