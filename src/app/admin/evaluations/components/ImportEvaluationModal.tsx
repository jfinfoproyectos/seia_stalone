'use client';

import { useState } from 'react';


import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
// import { importEvaluacion } from '../actions';

interface ImportEvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ImportEvaluationModal({
  isOpen,
  onClose,
}: ImportEvaluationModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/json') {
      setFile(selectedFile);
      setStatus('idle');
      setErrorMessage('');
    } else {
      setErrorMessage('Por favor selecciona un archivo JSON válido.');
      setFile(null);
    }
  };

  const handleImport = async () => {
    alert('La importación de evaluaciones aún no está implementada en admin.');
  };

  const handleClose = () => {
    setFile(null);
    setStatus('idle');
    setErrorMessage('');
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
                  {/* Indicador de importación con animación */}
                  <div className="relative w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-blue-500 to-cyan-600 shadow-lg">
                    <div className="absolute inset-0 rounded-xl bg-white/20 animate-pulse" />
                    <Upload className="w-6 h-6 text-white" />
                  </div>
                  
                  <div>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                      Importar Evaluación
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                      Cargar evaluación desde archivo
                    </p>
                  </div>
                </div>
                
                {/* Botón cerrar elegante */}
                <button
                  onClick={handleClose}
                  className="group relative w-10 h-10 rounded-xl bg-muted/50 hover:bg-destructive/10 border border-border/50 hover:border-destructive/30 transition-all duration-200 flex items-center justify-center"
                  aria-label="Cerrar importación"
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
                    ¡Evaluación importada exitosamente!
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
                  Selecciona un archivo JSON que contenga una evaluación exportada.
                </p>
              </div>
              
              {/* Área de carga de archivo */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Archivo de evaluación</label>
                <div className="relative">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer group block w-full p-6 border-2 border-dashed border-border/50 hover:border-primary/50 rounded-lg transition-all duration-200 bg-muted/20 hover:bg-muted/30"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <FileText className="w-6 h-6 text-primary" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-foreground">
                          {file ? file.name : 'Haz clic para seleccionar archivo JSON'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Solo archivos JSON
                        </p>
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
            
            {/* Barra inferior con botones de acción */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-border/30 bg-muted/20 rounded-b-2xl">
              <button
                onClick={handleClose}
                className="px-4 py-2 bg-muted/50 hover:bg-muted border border-border/30 hover:border-border/50 rounded-xl transition-all duration-200 text-sm font-medium"
              >
                Cancelar
              </button>
              
              <button
                onClick={handleImport}
                disabled={!file || status === 'success'}
                className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl transition-all duration-200 text-sm font-medium flex items-center gap-2 disabled:opacity-50"
              >
                {status === 'success' ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    ¡Importado!
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Importar
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