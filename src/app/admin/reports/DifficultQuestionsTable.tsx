"use client";

import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import MDEditor from '@uiw/react-md-editor';
import { useTheme } from 'next-themes';
import { type DifficultQuestionStat } from './actions';

interface DifficultQuestionsTableProps {
  questions: DifficultQuestionStat[];
}

export function DifficultQuestionsTable({ questions }: DifficultQuestionsTableProps) {
  const { theme } = useTheme();
  const [previewQuestion, setPreviewQuestion] = useState<DifficultQuestionStat | null>(null);

  return (
    <div className="mt-4 rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Evaluación</TableHead>
            <TableHead className="text-right">Puntaje Promedio</TableHead>
            <TableHead className="text-center">Vista Previa</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {questions.length > 0 ? (
            questions.map((q) => (
              <TableRow key={q.questionId}>
                <TableCell>
                  <p className="font-medium">{q.evaluationTitle}</p>
                </TableCell>
                <TableCell className="text-right font-mono">{q.averageScore.toFixed(1)}</TableCell>
                <TableCell className="text-center">
                  <Button variant="outline" size="sm" onClick={() => setPreviewQuestion(q)}>Ver</Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={3} className="text-center text-muted-foreground">
                No hay datos suficientes para analizar preguntas.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      
      {/* Vista previa flotante moderna */}
      {previewQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop con efecto blur */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in-0 duration-300"
            onClick={() => setPreviewQuestion(null)}
          />
          
          {/* Contenedor principal flotante */}
          <div className="relative w-full max-w-4xl max-h-[90vh] bg-background/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            {/* Barra superior con gradiente */}
            <div className="relative overflow-hidden rounded-t-2xl">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent" />
              <div className="relative flex items-center justify-between p-6">
                <div className="flex items-center gap-4">
                  {/* Indicador de dificultad con animación */}
                  <div className={`relative w-12 h-12 rounded-xl flex items-center justify-center ${
                    previewQuestion.averageScore >= 3.0 
                      ? 'bg-gradient-to-br from-green-500 to-teal-600' 
                      : previewQuestion.averageScore >= 2.0
                      ? 'bg-gradient-to-br from-yellow-500 to-orange-600'
                      : 'bg-gradient-to-br from-red-500 to-pink-600'
                  } shadow-lg`}>
                    <div className="absolute inset-0 rounded-xl bg-white/20 animate-pulse" />
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  
                  <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                      Vista Previa de la Pregunta
                    </h1>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                        previewQuestion.averageScore >= 3.0
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                          : previewQuestion.averageScore >= 2.0
                          ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                      }`}>
                        {previewQuestion.averageScore >= 3.0 ? 'Fácil' : previewQuestion.averageScore >= 2.0 ? 'Moderada' : 'Difícil'}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        Promedio: {previewQuestion.averageScore.toFixed(1)}/5.0
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Botón cerrar elegante */}
                <button
                  onClick={() => setPreviewQuestion(null)}
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
                <div className="relative bg-gradient-to-br from-muted/30 via-background/50 to-muted/20 border border-border/30 rounded-xl p-8 min-h-[300px] backdrop-blur-sm" data-color-mode={theme}>
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <MDEditor.Markdown source={previewQuestion.questionText} />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Barra inferior con información */}
            <div className="flex items-center justify-between p-6 border-t border-border/30 bg-muted/20 rounded-b-2xl">
              <div className="flex items-center gap-4">
                <div className="text-sm text-muted-foreground">
                  Evaluación: {previewQuestion.evaluationTitle}
                </div>
                <div className="w-px h-4 bg-border" />
                <div className="text-sm text-muted-foreground">
                  Pregunta ID: {previewQuestion.questionId}
                </div>
                <div className="w-px h-4 bg-border" />
                <div className="text-sm text-muted-foreground">
                  Puntuación promedio: {previewQuestion.averageScore.toFixed(1)}/5.0
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  previewQuestion.averageScore >= 3.0 ? 'bg-green-500' :
                  previewQuestion.averageScore >= 2.0 ? 'bg-yellow-500' : 'bg-red-500'
                }`} />
                <span className="text-sm font-medium">
                  {previewQuestion.averageScore >= 3.0 ? 'Pregunta Fácil' :
                   previewQuestion.averageScore >= 2.0 ? 'Dificultad Moderada' : 'Pregunta Difícil'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}