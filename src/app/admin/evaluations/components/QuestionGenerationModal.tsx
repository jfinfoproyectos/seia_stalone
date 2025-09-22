'use client';

import { useState } from 'react';

import { Textarea } from '@/components/ui/textarea';
import { Loader2, Wand2, CheckCircle, AlertCircle } from 'lucide-react';


interface QuestionGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (prompt: string) => Promise<void>;
  isGenerating: boolean;
}

export function QuestionGenerationModal({
  isOpen,
  onClose,
  onGenerate,
  isGenerating,
}: QuestionGenerationModalProps) {
  const [prompt, setPrompt] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleGenerateClick = async () => {
    if (!prompt.trim()) return;
    
    setStatus('idle');
    setErrorMessage('');
    
    try {
      await onGenerate(prompt);
      setStatus('success');
      setPrompt('');
      setTimeout(() => {
        setStatus('idle');
        onClose();
      }, 1500);
    } catch (error) {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Error desconocido al generar la pregunta');
    }
  };

  const handleClose = () => {
    setStatus('idle');
    setErrorMessage('');
    setPrompt('');
    onClose();
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop con efecto blur */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in-0 duration-300"
            onClick={handleClose}
          />
          
          {/* Contenedor principal flotante */}
          <div className="relative w-full max-w-lg bg-background/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            {/* Barra superior con gradiente */}
            <div className="relative overflow-hidden rounded-t-2xl">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent" />
              <div className="relative flex items-center justify-between p-6">
                <div className="flex items-center gap-4">
                  {/* Indicador de IA con animación */}
                  <div className="relative w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg">
                    <div className="absolute inset-0 rounded-xl bg-white/20 animate-pulse" />
                    <Wand2 className="w-6 h-6 text-white" />
                  </div>
                  
                  <div>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                      Generar Pregunta con IA
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                      Crea preguntas automáticamente
                    </p>
                  </div>
                </div>
                
                {/* Botón cerrar elegante */}
                <button
                  onClick={handleClose}
                  disabled={isGenerating}
                  className="group relative w-10 h-10 rounded-xl bg-muted/50 hover:bg-destructive/10 border border-border/50 hover:border-destructive/30 transition-all duration-200 flex items-center justify-center disabled:opacity-50"
                  aria-label="Cerrar generador"
                >
                  <svg className="w-5 h-5 text-muted-foreground group-hover:text-destructive transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Contenido principal */}
            <div className="px-6 py-4 space-y-4">
              {/* Alertas de estado */}
              {status === 'success' && (
                <div className="p-4 bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <p className="text-sm text-green-800 dark:text-green-200">
                    ¡Pregunta generada exitosamente! Se ha copiado al editor.
                  </p>
                </div>
              )}
              
              {status === 'error' && (
                <div className="p-4 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <p className="text-sm text-red-800 dark:text-red-200">
                    {errorMessage}
                  </p>
                </div>
              )}
              
              {/* Instrucciones */}
              <div className="p-4 bg-muted/30 border border-border/30 rounded-lg">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Escribe una idea o tema para la pregunta. La IA la convertirá en un enunciado formal en formato Markdown, teniendo en cuenta el tipo y lenguaje que hayas seleccionado.
                </p>
              </div>
              
              {/* Campo de entrada */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Descripción de la pregunta</label>
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Ej: una función en Javascript que sume dos números"
                  className="min-h-[120px] bg-background/50 border-border/30 focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
                  disabled={isGenerating || status === 'success'}
                />
              </div>
            </div>
            
            {/* Barra inferior con botones de acción */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-border/30 bg-muted/20 rounded-b-2xl">
              <button
                onClick={handleClose}
                disabled={isGenerating}
                className="px-4 py-2 bg-muted/50 hover:bg-muted border border-border/30 hover:border-border/50 rounded-xl transition-all duration-200 text-sm font-medium disabled:opacity-50"
              >
                Cancelar
              </button>
              
              <button
                onClick={handleGenerateClick}
                disabled={isGenerating || !prompt.trim() || status === 'success'}
                className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl transition-all duration-200 text-sm font-medium flex items-center gap-2 disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generando...
                  </>
                ) : status === 'success' ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    ¡Generado!
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    Generar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}