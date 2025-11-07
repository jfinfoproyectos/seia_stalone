'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Key, Save, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import { 
  getApiKeyFromStorage, 
  setApiKeyInStorage, 
  removeApiKeyFromStorage, 
  validateApiKeyFormat,
  useApiKeyStatus 
} from '@/lib/apiKeyService';

interface ApiKeyConfigProps {
  title?: string;
  description?: string;
  className?: string;
  onSaved?: () => void;
}

export function ApiKeyConfig({ 
  title = "Configuración de API Key de Gemini",
  description = "Configura tu API key personal de Google Gemini para usar las funciones de IA.",
  className = "",
  onSaved
}: ApiKeyConfigProps) {
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const apiKeyStatus = useApiKeyStatus();

  useEffect(() => {
    // Cargar la API key existente al montar el componente
    const existingKey = getApiKeyFromStorage();
    if (existingKey) {
      setApiKey(existingKey);
    }
  }, []);

  const handleSave = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      if (!apiKey.trim()) {
        setMessage({ type: 'error', text: 'Por favor, ingresa una API key válida.' });
        return;
      }

      if (!validateApiKeyFormat(apiKey.trim())) {
        setMessage({ 
          type: 'error', 
          text: 'El formato de la API key no es válido. Debe comenzar con "AIza" y tener más de 10 caracteres.' 
        });
        return;
      }

      setApiKeyInStorage(apiKey.trim());
      setMessage({ type: 'success', text: 'API key guardada correctamente.' });
      // Notificar al padre para cerrar el modal si se proporciona
      try {
        onSaved?.();
      } catch {}
    } catch (error) {
      console.error('Error saving API key:', error);
      setMessage({ type: 'error', text: 'Error al guardar la API key. Inténtalo de nuevo.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = () => {
    try {
      removeApiKeyFromStorage();
      setApiKey('');
      setMessage({ type: 'info', text: 'API key eliminada correctamente.' });
    } catch (error) {
      console.error('Error removing API key:', error);
      setMessage({ type: 'error', text: 'Error al eliminar la API key.' });
    }
  };

  const handleInputChange = (value: string) => {
    setApiKey(value);
    setMessage(null); // Limpiar mensajes al cambiar el input
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Estado actual de la API key */}
        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
          {apiKeyStatus.hasKey ? (
            <>
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm">
                API key configurada {apiKeyStatus.isValid ? '(válida)' : '(formato inválido)'}
              </span>
            </>
          ) : (
            <>
              <AlertCircle className="h-4 w-4 text-orange-500" />
              <span className="text-sm">No hay API key configurada</span>
            </>
          )}
        </div>

        {/* Input para la API key */}
        <div className="space-y-2">
          <Label htmlFor="apiKey">API Key de Google Gemini</Label>
          <div className="relative">
            <Input
              id="apiKey"
              type={showApiKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="API Key"
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowApiKey(!showApiKey)}
            >
              {showApiKey ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Obtén tu API key en{' '}
            <a 
              href="https://makersuite.google.com/app/apikey" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Google AI Studio
            </a>
          </p>
        </div>

        {/* Mensajes de estado */}
        {message && (
          <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        {/* Botones de acción */}
        <div className="flex gap-2">
          <Button 
            onClick={handleSave} 
            disabled={isLoading || !apiKey.trim()}
            className="flex-1"
          >
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? 'Guardando...' : 'Guardar'}
          </Button>
          
          {apiKeyStatus.hasKey && (
            <Button 
              variant="outline" 
              onClick={handleRemove}
              disabled={isLoading}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar
            </Button>
          )}
        </div>

        {/* Información adicional */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Tu API key se almacena localmente en tu navegador</p>
          <p>• No se envía a nuestros servidores</p>
          <p>• Necesitarás configurarla en cada dispositivo que uses</p>
        </div>
      </CardContent>
    </Card>
  );
}