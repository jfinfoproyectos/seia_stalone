import dynamic from 'next/dynamic';
import { useMonacoConfig } from '../hooks/useMonacoConfig';
import React, { useRef, useEffect, useState } from 'react';
import type { editor } from 'monaco-editor';

// Declaración de tipo para window.monaco
declare global {
  interface Window {
    monaco: {
      editor: {
        setTheme: (theme: string) => void;
      };
    };
  }
}

// Carga diferida del editor Monaco
const MonacoEditor = dynamic(
  () => import('@monaco-editor/react').then((mod) => mod.default),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full w-full bg-black rounded-lg">
        Cargando editor...
      </div>
    )
  }
);

interface CodeEditorProps {
  value: string;
  onChange: (value: string, element?: HTMLElement) => void;
  language: string;
  height?: string;
}

export const CodeEditor = ({ value, onChange, language, height = '100%' }: CodeEditorProps) => {
  const { getEditorOptions, currentTheme, defineCustomThemes } = useMonacoConfig();
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const [editorError, setEditorError] = useState<string | null>(null);
  const [isEditorReady, setIsEditorReady] = useState(false);

  // Función para manejar cambios
  const handleChange = (newValue: string) => {
    try {
      // Obtener el elemento DOM del editor Monaco
      const editorElement = editorRef.current?.getDomNode();
      onChange(newValue, editorElement || undefined);
    } catch (error) {
      console.error('[CodeEditor] Error en handleChange:', error);
      setEditorError('Error al procesar el cambio en el editor');
    }
  };

  // Funciones de prevención removidas - editor sin restricciones

  // Manejo de errores del editor
  const handleEditorError = (error: unknown) => {
    console.error('[CodeEditor] Error del editor Monaco:', error);
    setEditorError('Error al cargar el editor de código');
  };

  // Limpiar error cuando el editor se monta correctamente
  useEffect(() => {
    if (isEditorReady && editorError) {
      setEditorError(null);
    }
  }, [isEditorReady, editorError]);

  // Actualizar tema del editor cuando cambie el tema de la aplicación
  useEffect(() => {
    if (isEditorReady && editorRef.current && window.monaco) {
      try {
        window.monaco.editor.setTheme(currentTheme);
      } catch (error) {
        console.error('[CodeEditor] Error al actualizar tema:', error);
      }
    }
  }, [currentTheme, isEditorReady]);



  if (editorError) {
    return (
      <div className="w-full h-full rounded-lg overflow-hidden">
        <div className="flex items-center justify-center h-full w-full bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <div className="text-center p-4">
            <p className="text-red-600 dark:text-red-400 mb-2">Error al cargar el editor</p>
            <p className="text-sm text-red-500 dark:text-red-300">{editorError}</p>
            <button 
              onClick={() => {
                setEditorError(null);
                setIsEditorReady(false);
              }}
              className="mt-2 px-3 py-1 text-xs bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 rounded hover:bg-red-200 dark:hover:bg-red-700"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 mx-3 sm:mx-4">
      <div className="w-full h-full border border-input rounded-md bg-transparent shadow-xs transition-[color,box-shadow] focus-within:border-ring overflow-hidden relative">
        <MonacoEditor
          height={height}
          language={language}
          value={value}
          onChange={(value) => handleChange(value || '')}
          options={{
            ...getEditorOptions(window.innerWidth < 640),
          }}
          theme={currentTheme}
          defaultValue=""
          loading={
            <div className="flex items-center justify-center h-full w-full bg-background rounded-lg">
              Cargando editor...
            </div>
          }
          onMount={(editor, monaco) => {
            try {
              // Definir temas personalizados primero
              defineCustomThemes(monaco);
              
              // Aplicar el tema después de definir los temas personalizados
              monaco.editor.setTheme(currentTheme);
              
              editorRef.current = editor;
              setIsEditorReady(true);

              const updateEditorOptions = () => {
                try {
                  const isMobile = window.innerWidth < 640;
                  editor.updateOptions({
                    ...getEditorOptions(isMobile),
                  });
                } catch (error) {
                  console.error('[CodeEditor] Error al actualizar opciones:', error);
                }
              };

              // Configurar opciones del editor con restricciones de pegar
              editor.updateOptions({ 
                // Deshabilitar menú contextual completamente para evitar pegar
                contextmenu: false,
                // Habilitar selección múltiple
                multiCursorModifier: 'ctrlCmd',
                // Deshabilitar drag and drop para evitar pegar archivos
                dragAndDrop: false,
              });

              // Interceptar el método executeEdits para bloquear pegado
              const originalExecuteEdits = editor.executeEdits;
              editor.executeEdits = (source: string, edits: editor.IIdentifiedSingleEditOperation[], endCursorState?: unknown) => {
                // Bloquear solo si la fuente es explícitamente paste o clipboard
                if (source === 'paste' || source === 'clipboard') {
                  console.warn('[CodeEditor] Operación de pegado bloqueada desde executeEdits:', source);
                  return false;
                }
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                return originalExecuteEdits.call(editor, source, edits, endCursorState as any);
              };

              // Interceptar el método trigger para bloquear comandos de pegado
              const originalTrigger = editor.trigger;
              editor.trigger = (source: string, handlerId: string, payload: unknown) => {
                const pasteCommands = [
                  'paste', 
                  'editor.action.clipboardPasteAction', 
                  'editor.action.paste'
                ];
                
                if (pasteCommands.includes(handlerId)) {
                  console.warn('[CodeEditor] Comando de pegar bloqueado:', handlerId);
                  return Promise.resolve();
                }
                
                // Para el comando 'type', solo bloquear si es claramente un pegado
                if (handlerId === 'type' && payload && typeof payload === 'object' && 'text' in payload) {
                  const typedPayload = payload as { text: string };
                  // Bloquear solo si el texto es muy largo Y contiene múltiples líneas (típico de pegado)
                  if (typedPayload.text.length > 100 && typedPayload.text.includes('\n')) {
                    console.warn('[CodeEditor] Pegado de múltiples líneas detectado y bloqueado');
                    return Promise.resolve();
                  }
                }
                
                return originalTrigger.call(editor, source, handlerId, payload);
              };

              // Deshabilitar acciones específicas del editor
              const pasteActions = [
                'editor.action.clipboardPasteAction',
                'editor.action.paste',
                'paste'
              ];

              pasteActions.forEach(actionId => {
                try {
                  const action = editor.getAction(actionId);
                  if (action) {
                    action.run = () => {
                      console.warn('[CodeEditor] Acción de pegar bloqueada:', actionId);
                      return Promise.resolve();
                    };
                  }
                } catch (error) {
                  console.warn('[CodeEditor] No se pudo deshabilitar la acción:', actionId, error);
                }
              });

              // Event listeners para bloquear eventos de pegar
              const editorDomNode = editor.getDomNode();
              if (editorDomNode) {
                // Bloquear eventos de pegar en el DOM
                const preventPaste = (e: Event) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.warn('[CodeEditor] Evento de pegar bloqueado');
                  return false;
                };

                const preventDrop = (e: DragEvent) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.warn('[CodeEditor] Evento de drop bloqueado');
                  return false;
                };

                const preventKeyboardPaste = (e: KeyboardEvent) => {
                  // Bloquear Ctrl+V, Ctrl+Shift+V, Shift+Insert
                  if ((e.ctrlKey && e.key === 'v') || 
                      (e.ctrlKey && e.shiftKey && e.key === 'V') ||
                      (e.shiftKey && e.key === 'Insert')) {
                    e.preventDefault();
                    e.stopPropagation();
                    console.warn('[CodeEditor] Atajo de teclado para pegar bloqueado');
                    return false;
                  }
                };

                // Agregar event listeners
                editorDomNode.addEventListener('paste', preventPaste, true);
                editorDomNode.addEventListener('drop', preventDrop, true);
                editorDomNode.addEventListener('dragover', preventDrop, true);
                editorDomNode.addEventListener('keydown', preventKeyboardPaste, true);

                // También bloquear en el contenedor del editor
                const textArea = editorDomNode.querySelector('textarea');
                if (textArea) {
                  textArea.addEventListener('paste', preventPaste, true);
                  textArea.addEventListener('drop', preventDrop, true);
                  textArea.addEventListener('keydown', preventKeyboardPaste, true);
                }

              }

              editor.layout();

              window.addEventListener('resize', updateEditorOptions);
              
              // Retornar función de cleanup que incluye tanto resize como paste prevention
              return () => {
                window.removeEventListener('resize', updateEditorOptions);
                
                // Cleanup de event listeners de paste prevention
                const editorDomNode = editor.getDomNode();
                if (editorDomNode) {
                  const preventPaste = () => {};
                  const preventDrop = () => {};
                  const preventKeyboardPaste = () => {};
                  
                  editorDomNode.removeEventListener('paste', preventPaste, true);
                  editorDomNode.removeEventListener('drop', preventDrop, true);
                  editorDomNode.removeEventListener('dragover', preventDrop, true);
                  editorDomNode.removeEventListener('keydown', preventKeyboardPaste, true);
                  
                  const textArea = editorDomNode.querySelector('textarea');
                  if (textArea) {
                    textArea.removeEventListener('paste', preventPaste, true);
                    textArea.removeEventListener('drop', preventDrop, true);
                    textArea.removeEventListener('keydown', preventKeyboardPaste, true);
                  }
                }
              };
            } catch (error) {
              console.error('[CodeEditor] Error en onMount:', error);
              handleEditorError(error);
            }
          }}
          onValidate={(markers) => {
            // Manejar errores de validación del editor
            if (markers && markers.length > 0) {
              const errors = markers.filter(marker => marker.severity === 8); // Error severity
              if (errors.length > 0) {
                console.warn('[CodeEditor] Errores de validación:', errors);
              }
            }
          }}
        />
        

      </div>
    </div>
  );
};