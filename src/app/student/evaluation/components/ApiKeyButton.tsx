'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Key, CheckCircle, AlertCircle } from 'lucide-react';
import { ApiKeyConfig } from '@/components/ui/api-key-config';
import { useApiKeyStatus } from '@/lib/apiKeyService';

interface ApiKeyButtonProps {
  className?: string;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ApiKeyButton({ className = "", isOpen, onOpenChange }: ApiKeyButtonProps) {
  const [internalIsDialogOpen, setInternalIsDialogOpen] = useState(false);
  
  // Usar el estado externo si se proporciona, de lo contrario usar el interno
  const isDialogOpen = isOpen !== undefined ? isOpen : internalIsDialogOpen;
  const setIsDialogOpen = onOpenChange || setInternalIsDialogOpen;
  const apiKeyStatus = useApiKeyStatus();

  const getButtonVariant = () => {
    if (apiKeyStatus.hasKey && apiKeyStatus.isValid) {
      return "outline";
    }
    return "destructive";
  };

  const getButtonIcon = () => {
    if (apiKeyStatus.hasKey && apiKeyStatus.isValid) {
      return <CheckCircle className="h-3 w-3" />;
    }
    return <AlertCircle className="h-3 w-3" />;
  };

  const getTooltipText = () => {
    if (apiKeyStatus.hasKey && apiKeyStatus.isValid) {
      return "API key configurada correctamente";
    }
    if (apiKeyStatus.hasKey && !apiKeyStatus.isValid) {
      return "API key configurada pero inválida";
    }
    return "Configurar API key de Gemini";
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button
                variant={getButtonVariant()}
                size="icon"
                className={`flex-shrink-0 ${className}`}
              >
                {getButtonIcon()}
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent>
            {getTooltipText()}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            Configuración de API Key
          </DialogTitle>
          <DialogDescription>
            Configura tu API key personal de Google Gemini para usar las funciones de evaluación con IA.
          </DialogDescription>
        </DialogHeader>
        
        <ApiKeyConfig 
          title=""
          description="Esta API key se almacenará localmente en tu navegador y será necesaria para obtener retroalimentación de IA en tus respuestas."
          className="border-0 shadow-none"
        />
      </DialogContent>
    </Dialog>
  );
}