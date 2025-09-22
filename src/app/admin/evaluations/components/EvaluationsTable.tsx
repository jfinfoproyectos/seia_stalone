"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { EvaluationTableRow } from '../types';

interface EvaluationsTableProps {
  evaluations: EvaluationTableRow[];
  teachers: Array<{
    id: number | string;
    firstName?: string | null;
    lastName?: string | null;
    email: string;
    name?: string;
  }>;
  onQuestions: (id: number) => void;
  onExport: (id: number) => void;
}

export function EvaluationsTable({ evaluations, teachers, onQuestions, onExport }: EvaluationsTableProps) {
  const [filterTeacher, setFilterTeacher] = useState("all");
  const [filteredEvaluations, setFilteredEvaluations] = useState<EvaluationTableRow[]>(evaluations);
  const [viewEval, setViewEval] = useState<EvaluationTableRow | null>(null);

  useEffect(() => {
    if (!filterTeacher || filterTeacher === "all") setFilteredEvaluations(evaluations);
    else setFilteredEvaluations(evaluations.filter(ev => String(ev.authorId) === filterTeacher));
  }, [filterTeacher, evaluations]);

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex items-center gap-2 mb-4">
        <label>Filtrar por docente:</label>
        <Select value={filterTeacher} onValueChange={setFilterTeacher}>
          <SelectTrigger className="w-[300px]">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {teachers.map(t => (
              <SelectItem key={t.id} value={String(t.id)}>
                {(t.firstName ?? "")} {(t.lastName ?? "")} ({t.email})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <table className="w-full border text-sm min-w-[900px]">
        <thead>
          <tr className="bg-muted">
            <th className="p-2 text-left">Título</th>
            <th className="p-2 text-left">Docente</th>
            <th className="p-2 text-left">Área</th>
            <th className="p-2 text-center">Intentos</th>
            <th className="p-2 text-center">Fecha</th>
            <th className="p-2 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {filteredEvaluations.map(ev => (
            <tr key={ev.id} className="border-b">
              <td className="p-2 font-medium">{ev.title}</td>
              <td className="p-2">{(ev.author?.firstName ?? "")} {(ev.author?.lastName ?? "")}</td>
              <td className="p-2">{ev.author.area?.name || "Sin área"}</td>
              <td className="p-2 text-center">{ev._count?.attempts ?? 0}</td>
              <td className="p-2 text-center">{new Date(ev.createdAt).toLocaleDateString()}</td>
              <td className="p-2 text-right">
                <div className="flex gap-2 justify-end flex-wrap">
                  <Button size="sm" variant="outline" onClick={() => setViewEval(ev)}>Ver</Button>
                  <Button size="sm" variant="secondary" onClick={() => onQuestions(ev.id)}>Preguntas</Button>
                  <Button size="sm" variant="outline" onClick={() => onExport(ev.id)}>Exportar</Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* Vista previa flotante moderna */}
      {viewEval && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop con efecto blur */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in-0 duration-300"
            onClick={() => setViewEval(null)}
          />
          
          {/* Contenedor principal flotante */}
          <div className="relative w-full max-w-3xl max-h-[90vh] bg-background/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            {/* Barra superior con gradiente */}
            <div className="relative overflow-hidden rounded-t-2xl">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent" />
              <div className="relative flex items-center justify-between p-6">
                <div className="flex items-center gap-4">
                  {/* Indicador de evaluación con animación */}
                  <div className="relative w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
                    <div className="absolute inset-0 rounded-xl bg-white/20 animate-pulse" />
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  
                  <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                      Detalles de la Evaluación
                    </h1>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                        Evaluación
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {viewEval._count?.attempts ?? 0} intentos
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Botón cerrar elegante */}
                <button
                  onClick={() => setViewEval(null)}
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
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="p-4 bg-background/50 rounded-lg border border-border/30">
                          <h3 className="text-sm font-medium text-muted-foreground mb-2">Título</h3>
                          <p className="text-lg font-semibold">{viewEval.title}</p>
                        </div>
                        
                        <div className="p-4 bg-background/50 rounded-lg border border-border/30">
                          <h3 className="text-sm font-medium text-muted-foreground mb-2">Docente</h3>
                          <p className="font-medium">{(viewEval.author?.firstName ?? "")} {(viewEval.author?.lastName ?? "")}</p>
                          <p className="text-sm text-muted-foreground">{viewEval.author?.email}</p>
                        </div>
                        
                        <div className="p-4 bg-background/50 rounded-lg border border-border/30">
                          <h3 className="text-sm font-medium text-muted-foreground mb-2">Área</h3>
                          <p className="font-medium">{viewEval.author.area?.name || "Sin área"}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="p-4 bg-background/50 rounded-lg border border-border/30">
                          <h3 className="text-sm font-medium text-muted-foreground mb-2">Fecha de creación</h3>
                          <p className="font-medium">{new Date(viewEval.createdAt).toLocaleDateString()}</p>
                        </div>
                        
                        <div className="p-4 bg-background/50 rounded-lg border border-border/30">
                          <h3 className="text-sm font-medium text-muted-foreground mb-2">Intentos</h3>
                          <p className="text-2xl font-bold text-primary">{viewEval._count?.attempts ?? 0}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-background/50 rounded-lg border border-border/30">
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Descripción</h3>
                      <p className="text-sm leading-relaxed">
                        {viewEval.description || <span className="text-muted-foreground italic">Sin descripción</span>}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Barra inferior con botones de acción */}
            <div className="flex items-center justify-between p-6 border-t border-border/30 bg-muted/20 rounded-b-2xl">
              <div className="flex items-center gap-4">
                <div className="text-sm text-muted-foreground">
                  Evaluación creada el {new Date(viewEval.createdAt).toLocaleDateString()}
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setViewEval(null);
                    onQuestions(viewEval.id);
                  }}
                  className="group relative px-4 py-2 bg-primary/10 hover:bg-primary/20 border border-primary/30 hover:border-primary/50 rounded-xl transition-all duration-200 flex items-center gap-2"
                >
                  <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium text-primary">Ver Preguntas</span>
                </button>
                
                <button
                  onClick={() => {
                    setViewEval(null);
                    onExport(viewEval.id);
                  }}
                  className="group relative px-4 py-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 hover:border-green-500/50 rounded-xl transition-all duration-200 flex items-center gap-2"
                >
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-sm font-medium text-green-600">Exportar PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}