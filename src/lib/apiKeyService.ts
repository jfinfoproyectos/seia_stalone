'use client';

/**
 * Servicio de gestión de API Keys de Gemini usando localStorage
 * Cada usuario configura y almacena su propia API key localmente
 */

const GEMINI_API_KEY_STORAGE_KEY = 'gemini_api_key';

/**
 * Obtiene la API key de Gemini desde localStorage
 * @returns La API key o null si no está configurada
 */
export function getApiKeyFromStorage(): string | null {
  if (typeof window === 'undefined') {
    return null; // No hay localStorage en el servidor
  }
  
  try {
    return localStorage.getItem(GEMINI_API_KEY_STORAGE_KEY);
  } catch (error) {
    console.error('Error accessing localStorage:', error);
    return null;
  }
}

/**
 * Guarda la API key de Gemini en localStorage
 * @param apiKey - La API key a guardar
 */
export function setApiKeyInStorage(apiKey: string): void {
  if (typeof window === 'undefined') {
    throw new Error('localStorage is not available on the server');
  }
  
  try {
    localStorage.setItem(GEMINI_API_KEY_STORAGE_KEY, apiKey);
  } catch (error) {
    console.error('Error saving to localStorage:', error);
    throw new Error('Failed to save API key to localStorage');
  }
}

/**
 * Elimina la API key de Gemini de localStorage
 */
export function removeApiKeyFromStorage(): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    localStorage.removeItem(GEMINI_API_KEY_STORAGE_KEY);
  } catch (error) {
    console.error('Error removing from localStorage:', error);
  }
}

/**
 * Verifica si hay una API key configurada
 * @returns true si hay una API key configurada, false en caso contrario
 */
export function hasApiKey(): boolean {
  const apiKey = getApiKeyFromStorage();
  return apiKey !== null && apiKey.trim() !== '';
}

/**
 * Valida el formato básico de una API key de Gemini
 * @param apiKey - La API key a validar
 * @returns true si el formato es válido, false en caso contrario
 */
export function validateApiKeyFormat(apiKey: string): boolean {
  // Las API keys de Gemini suelen tener un formato específico
  // Aquí puedes ajustar la validación según el formato real
  return !!(apiKey && apiKey.trim().length > 10 && apiKey.startsWith('AIza'));
}

/**
 * Obtiene la API key para usar en las llamadas a Gemini
 * Esta función reemplaza la anterior getApiKey que usaba la base de datos
 * @returns La API key configurada por el usuario
 * @throws Error si no hay API key configurada
 */
export function getApiKey(): string {
  const apiKey = getApiKeyFromStorage();
  
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('API Key de Gemini no configurada. Por favor, configura tu API key en la configuración.');
  }
  
  return apiKey;
}

/**
 * Hook para verificar el estado de la API key
 * @returns Objeto con información sobre el estado de la API key
 */
export function useApiKeyStatus() {
  if (typeof window === 'undefined') {
    return {
      hasKey: false,
      isValid: false,
      key: null
    };
  }

  const apiKey = getApiKeyFromStorage();
  const hasKey = apiKey !== null && apiKey.trim() !== '';
  const isValid = hasKey ? validateApiKeyFormat(apiKey) : false;

  return {
    hasKey,
    isValid,
    key: apiKey
  };
}