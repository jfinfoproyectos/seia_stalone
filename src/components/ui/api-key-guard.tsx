'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { ApiKeyConfig } from './api-key-config';
import { useApiKeyStatus } from '@/lib/apiKeyService';

interface ApiKeyGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showModal?: boolean;
  onApiKeyConfigured?: () => void;
}

export function ApiKeyGuard({ 
  children, 
  fallback,
  showModal = true,
  onApiKeyConfigured 
}: ApiKeyGuardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const apiKeyStatus = useApiKeyStatus();

  useEffect(() => {
    // Si no hay API key y se debe mostrar el modal, abrirlo
    if (!apiKeyStatus.hasKey && showModal) {
      setIsModalOpen(true);
    } else if (apiKeyStatus.hasKey) {
      setIsModalOpen(false);
      onApiKeyConfigured?.();
    }
  }, [apiKeyStatus.hasKey, showModal, onApiKeyConfigured]);

  // Si hay API key válida, mostrar el contenido
  if (apiKeyStatus.hasKey && apiKeyStatus.isValid) {
    return <>{children}</>;
  }

  // Si hay fallback personalizado, usarlo
  if (fallback) {
    return <>{fallback}</>;
  }

  // Fallback por defecto
  const defaultFallback = (
    <Alert variant="destructive" className="m-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        Para usar esta función, necesitas configurar tu API key de Google Gemini.
        {showModal && ' Se abrirá un modal para configurarla.'}
      </AlertDescription>
    </Alert>
  );

  return (
    <>
      {defaultFallback}
      
      {showModal && (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Configuración Requerida</DialogTitle>
              <DialogDescription>
                Para continuar, necesitas configurar tu API key personal de Google Gemini.
              </DialogDescription>
            </DialogHeader>
            
            <ApiKeyConfig 
              title="Configura tu API Key"
              description="Esta API key se almacenará localmente en tu navegador y será necesaria para usar las funciones de IA."
              className="border-0 shadow-none"
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

// Hook para verificar si se puede ejecutar una acción que requiere API key
export function useApiKeyRequired() {
  const apiKeyStatus = useApiKeyStatus();
  
  return {
    canExecute: apiKeyStatus.hasKey && apiKeyStatus.isValid,
    hasKey: apiKeyStatus.hasKey,
    isValid: apiKeyStatus.isValid,
    requiresSetup: !apiKeyStatus.hasKey || !apiKeyStatus.isValid,
    apiKey: apiKeyStatus.key
  };
}