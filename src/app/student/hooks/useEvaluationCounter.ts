import { useState, useEffect, useCallback } from 'react';
import { getApiKeyFromStorage } from '@/lib/apiKeyService';

interface EvaluationCounterData {
  count: number;
  email: string;
  lastUpdated: string;
  apiKeyHash?: string; // Hash de la API key para detectar cambios
}

export function useEvaluationCounter(email: string) {
  const [evaluationCount, setEvaluationCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Función para crear un hash simple de la API key
  const createApiKeyHash = useCallback((apiKey: string | null): string => {
    if (!apiKey) return 'no-key';
    // Crear un hash simple usando los primeros y últimos caracteres
    const start = apiKey.substring(0, 8);
    const end = apiKey.substring(apiKey.length - 8);
    return `${start}...${end}`;
  }, []);

  // Clave para localStorage basada en el email
  const getStorageKey = useCallback((userEmail: string) => {
    return `evaluation_counter_${userEmail}`;
  }, []);

  // Inicializar el contador desde localStorage
  useEffect(() => {
    if (!email) {
      setIsLoading(false);
      return;
    }

    const storageKey = getStorageKey(email);
    const currentApiKey = getApiKeyFromStorage();
    const currentApiKeyHash = createApiKeyHash(currentApiKey);
    
    try {
      const storedData = localStorage.getItem(storageKey);
      
      if (storedData) {
        const parsedData: EvaluationCounterData = JSON.parse(storedData);
        
        // Verificar que los datos corresponden al email actual
        if (parsedData.email === email) {
          // Verificar si la API key ha cambiado
          const storedApiKeyHash = parsedData.apiKeyHash || 'no-key';
          
          if (storedApiKeyHash === currentApiKeyHash) {
            // La API key no ha cambiado, usar el contador existente
            setEvaluationCount(parsedData.count);
          } else {
            // La API key ha cambiado, reiniciar el contador
            console.log('API key ha cambiado, reiniciando contador de evaluaciones');
            setEvaluationCount(0);
            const newData: EvaluationCounterData = {
              count: 0,
              email: email,
              lastUpdated: new Date().toISOString(),
              apiKeyHash: currentApiKeyHash
            };
            localStorage.setItem(storageKey, JSON.stringify(newData));
          }
        } else {
          // Si el email no coincide, inicializar en 0
          setEvaluationCount(0);
          const newData: EvaluationCounterData = {
            count: 0,
            email: email,
            lastUpdated: new Date().toISOString(),
            apiKeyHash: currentApiKeyHash
          };
          localStorage.setItem(storageKey, JSON.stringify(newData));
        }
      } else {
        // No hay datos previos, inicializar en 0
        setEvaluationCount(0);
        const newData: EvaluationCounterData = {
          count: 0,
          email: email,
          lastUpdated: new Date().toISOString(),
          apiKeyHash: currentApiKeyHash
        };
        localStorage.setItem(storageKey, JSON.stringify(newData));
      }
    } catch (error) {
      console.error('Error al cargar el contador de evaluaciones:', error);
      // En caso de error, inicializar en 0
      setEvaluationCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [email, getStorageKey, createApiKeyHash]);

  // Efecto para detectar cambios en la API key en tiempo real
  useEffect(() => {
    if (!email || isLoading) return;

    const checkApiKeyChange = () => {
      const storageKey = getStorageKey(email);
      const currentApiKey = getApiKeyFromStorage();
      const currentApiKeyHash = createApiKeyHash(currentApiKey);

      try {
        const storedData = localStorage.getItem(storageKey);
        if (storedData) {
          const parsedData: EvaluationCounterData = JSON.parse(storedData);
          const storedApiKeyHash = parsedData.apiKeyHash || 'no-key';

          if (storedApiKeyHash !== currentApiKeyHash) {
            console.log('Cambio de API key detectado, reiniciando contador');
            setEvaluationCount(0);
            const newData: EvaluationCounterData = {
              count: 0,
              email: email,
              lastUpdated: new Date().toISOString(),
              apiKeyHash: currentApiKeyHash
            };
            localStorage.setItem(storageKey, JSON.stringify(newData));
          }
        }
      } catch (error) {
        console.error('Error al verificar cambio de API key:', error);
      }
    };

    // Verificar cambios cada 2 segundos
    const interval = setInterval(checkApiKeyChange, 2000);

    // Limpiar el intervalo al desmontar
    return () => clearInterval(interval);
  }, [email, isLoading, getStorageKey, createApiKeyHash]);

  // Función para incrementar el contador
  const incrementCounter = useCallback(() => {
    if (!email) return;

    const newCount = evaluationCount + 1;
    setEvaluationCount(newCount);

    const storageKey = getStorageKey(email);
    const currentApiKey = getApiKeyFromStorage();
    const currentApiKeyHash = createApiKeyHash(currentApiKey);
    
    const newData: EvaluationCounterData = {
      count: newCount,
      email: email,
      lastUpdated: new Date().toISOString(),
      apiKeyHash: currentApiKeyHash
    };

    try {
      localStorage.setItem(storageKey, JSON.stringify(newData));
    } catch (error) {
      console.error('Error al guardar el contador de evaluaciones:', error);
    }
  }, [email, evaluationCount, getStorageKey, createApiKeyHash]);

  // Función para resetear el contador (opcional)
  const resetCounter = useCallback(() => {
    if (!email) return;

    setEvaluationCount(0);
    const storageKey = getStorageKey(email);
    const currentApiKey = getApiKeyFromStorage();
    const currentApiKeyHash = createApiKeyHash(currentApiKey);
    
    const newData: EvaluationCounterData = {
      count: 0,
      email: email,
      lastUpdated: new Date().toISOString(),
      apiKeyHash: currentApiKeyHash
    };

    try {
      localStorage.setItem(storageKey, JSON.stringify(newData));
    } catch (error) {
      console.error('Error al resetear el contador de evaluaciones:', error);
    }
  }, [email, getStorageKey, createApiKeyHash]);

  // Función para obtener datos del contador (incluyendo última actualización)
  const getCounterData = useCallback((): EvaluationCounterData | null => {
    if (!email) return null;

    const storageKey = getStorageKey(email);
    
    try {
      const storedData = localStorage.getItem(storageKey);
      if (storedData) {
        return JSON.parse(storedData);
      }
    } catch (error) {
      console.error('Error al obtener datos del contador:', error);
    }
    
    return null;
  }, [email, getStorageKey]);

  return {
    evaluationCount,
    incrementCounter,
    resetCounter,
    getCounterData,
    isLoading
  };
}