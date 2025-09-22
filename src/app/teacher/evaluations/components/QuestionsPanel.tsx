"use client";
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { getPreguntasByEvaluacion, deletePregunta, createPregunta, updatePregunta } from '../actions';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription } from '@/components/ui/alert-dialog';
import { MarkdownViewer } from '@/app/teacher/evaluations/components/markdown-viewer';
import { QuestionDesigner } from './QuestionDesigner';

export interface Pregunta {
  id: number;
  text: string;
  type: string;
  language: string;
}

interface QuestionsPanelProps {
  evaluationId: number;
}

function normalizePregunta(p: unknown): Pregunta {
  const obj = p as Record<string, unknown>;
  return {
    id: Number(obj.id),
    text: String(obj.text ?? ''),
    type: String(obj.type ?? ''),
    language: String(obj.language ?? ''),
  };
}

// Función para normalizar el tipo de pregunta
function normalizeQuestionType(type: string): 'TEXT' | 'CODE' {
  const normalizedType = type.toLowerCase().trim();
  return normalizedType === 'code' ? 'CODE' : 'TEXT';
}

// Función para convertir el tipo de la UI a formato de BD
function toDatabaseType(type: 'TEXT' | 'CODE'): string {
  return type === 'CODE' ? 'CODE' : 'TEXT';
}

export function QuestionsPanel({ evaluationId }: QuestionsPanelProps) {
  const [preguntas, setPreguntas] = useState<Pregunta[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [previewPregunta, setPreviewPregunta] = useState<Pregunta | null>(null);
  const [editPregunta, setEditPregunta] = useState<Pregunta | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const data = await getPreguntasByEvaluacion(evaluationId);
      const normalized = data.map(normalizePregunta);
      setPreguntas(normalized);
    })();
  }, [evaluationId]);

  const handleCreate = () => {
    setShowForm(true);
  };

  const handleEdit = (pregunta: Pregunta) => {
    setEditPregunta(pregunta);
    setShowForm(true);
  };

  const handleSave = async (data: { text: string; type: 'TEXT' | 'CODE'; language?: string; }) => {
        
    const dbType = toDatabaseType(data.type); 
    
    if (editPregunta) {
      await updatePregunta(editPregunta.id, {
        text: data.text,
        type: dbType,
        language: data.language,
      });
    } else {
      await createPregunta(evaluationId, {
        text: data.text,
        type: dbType,
        language: data.language,
      });
    }
    setShowForm(false);
    setEditPregunta(null);
    // Refrescar preguntas
    const dataPregs = await getPreguntasByEvaluacion(evaluationId);
    const normalized = dataPregs.map(normalizePregunta);
    setPreguntas(normalized);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditPregunta(null);
  };

  const handleDelete = (id: number) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (deleteId !== null) {
      setPreguntas(preguntas.filter(p => p.id !== deleteId));
      await deletePregunta(deleteId);
      setDeleteId(null);
    }
  };

  const cancelDelete = () => setDeleteId(null);

  return (
    <>
      {showForm ? (
        <div className="mb-6">
          <QuestionDesigner
            initialData={editPregunta ? {
              id: editPregunta.id,
              text: editPregunta.text,
              type: normalizeQuestionType(editPregunta.type),
              language: editPregunta.language,
            } : undefined}
            onSave={handleSave}
            onCancel={handleCancel}
            onTextChange={() => {}}
          />
        </div>
      ) : (
        <>
          <div className="mb-4">
            <Button onClick={handleCreate} disabled={preguntas.length >= 20}>
              Agregar pregunta ({preguntas.length}/20)
            </Button>
          </div>
          <ul className="space-y-2">
            {preguntas.map((p, idx) => (
              <li key={p.id} className="border rounded p-2 flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Pregunta #{idx + 1}</span>
                    <span className="text-xs px-2 py-1 rounded bg-muted">{normalizeQuestionType(p.type) === 'CODE' ? 'Código' : 'Texto'}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => setPreviewPregunta(p)}>Vista previa</Button>
                    <Button size="sm" variant="secondary" onClick={() => handleEdit(p)}>Editar</Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(p.id)}>Eliminar</Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          {/* Vista previa flotante moderna */}
          {previewPregunta && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              {/* Backdrop con efecto blur */}
              <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in-0 duration-300"
                onClick={() => setPreviewPregunta(null)}
              />
              
              {/* Contenedor principal flotante */}
              <div className="relative w-full max-w-4xl max-h-[90vh] bg-background/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
                {/* Barra superior con gradiente */}
                <div className="relative overflow-hidden rounded-t-2xl">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent" />
                  <div className="relative flex items-center justify-between p-6">
                    <div className="flex items-center gap-4">
                      {/* Indicador de tipo con animación */}
                      <div className={`relative w-12 h-12 rounded-xl flex items-center justify-center ${
                        normalizeQuestionType(previewPregunta.type) === 'CODE' 
                          ? 'bg-gradient-to-br from-blue-500 to-purple-600' 
                          : 'bg-gradient-to-br from-green-500 to-teal-600'
                      } shadow-lg`}>
                        <div className="absolute inset-0 rounded-xl bg-white/20 animate-pulse" />
                        {normalizeQuestionType(previewPregunta.type) === 'CODE' ? (
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                          </svg>
                        ) : (
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        )}
                      </div>
                      
                      <div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                          Vista Previa
                        </h1>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                            normalizeQuestionType(previewPregunta.type) === 'CODE'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                              : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                          }`}>
                            {normalizeQuestionType(previewPregunta.type) === 'CODE' ? 'Código' : 'Texto'}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            Pregunta {preguntas.findIndex(p => p.id === previewPregunta.id) + 1} de {preguntas.length}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Botón cerrar elegante */}
                    <button
                      onClick={() => setPreviewPregunta(null)}
                      className="group relative w-10 h-10 rounded-xl bg-muted/50 hover:bg-destructive/10 border border-border/50 hover:border-destructive/30 transition-all duration-200 flex items-center justify-center"
                      aria-label="Cerrar vista previa"
                    >
                      <svg className="w-5 h-5 text-muted-foreground group-hover:text-destructive transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                {/* Contenido principal con scroll personalizado */}
                <div className="px-6 py-4 max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                  <div className="relative">
                    {/* Decoración de fondo */}
                    <div className="absolute top-0 left-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 right-0 w-24 h-24 bg-secondary/5 rounded-full blur-2xl" />
                    
                    {/* Contenedor del contenido */}
                    <div className="relative bg-gradient-to-br from-muted/30 via-background/50 to-muted/20 border border-border/30 rounded-xl p-8 min-h-[300px] backdrop-blur-sm">
                      <MarkdownViewer content={previewPregunta.text} />
                    </div>
                  </div>
                </div>
                
                {/* Barra inferior con acciones */}
                <div className="flex items-center justify-between p-6 border-t border-border/30 bg-muted/20 rounded-b-2xl">
                  {/* Navegación */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const currentIndex = preguntas.findIndex(p => p.id === previewPregunta.id);
                        if (currentIndex > 0) {
                          setPreviewPregunta(preguntas[currentIndex - 1]);
                        }
                      }}
                      disabled={preguntas.findIndex(p => p.id === previewPregunta.id) === 0}
                      className="group flex items-center gap-2 px-4 py-2.5 bg-background/80 hover:bg-background border border-border/50 hover:border-border rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-background/80"
                    >
                      <svg className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      <span className="text-sm font-medium">Anterior</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        const currentIndex = preguntas.findIndex(p => p.id === previewPregunta.id);
                        if (currentIndex < preguntas.length - 1) {
                          setPreviewPregunta(preguntas[currentIndex + 1]);
                        }
                      }}
                      disabled={preguntas.findIndex(p => p.id === previewPregunta.id) === preguntas.length - 1}
                      className="group flex items-center gap-2 px-4 py-2.5 bg-background/80 hover:bg-background border border-border/50 hover:border-border rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-background/80"
                    >
                      <span className="text-sm font-medium">Siguiente</span>
                      <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                  
                  {/* Acciones principales */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleEdit(previewPregunta)}
                      className="group flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
                    >
                      <svg className="w-4 h-4 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span className="font-medium">Editar Pregunta</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* Modal de confirmación para eliminar pregunta */}
          <AlertDialog open={deleteId !== null} onOpenChange={cancelDelete}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Eliminar pregunta</AlertDialogTitle>
                <AlertDialogDescription>
                  ¿Estás seguro de que deseas eliminar esta pregunta?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={cancelDelete}>
                  Cancelar
                </Button>
                <Button variant="destructive" onClick={confirmDelete}>
                  Eliminar
                </Button>
              </div>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </>
  );
}