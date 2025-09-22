'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check, BarChart3, FileText, List, Sparkles } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useSession } from 'next-auth/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface Attempt {
  id: number;
  evaluationId: number;
  uniqueCode: string;
  startTime: Date;
  endTime: Date;
  maxSubmissions?: number | null;
  evaluation?: {
    title: string;
  };
  _count: {
    submissions: number;
  };
}

interface SchedulesTableProps {
  attempts: Attempt[];
  onEdit: (attempt: Attempt) => void;
  onDelete: (id: number) => void;
  onSubmissions: (id: number) => void;
  onStats: (id: number) => void;
  onGenerateReport: (id: number) => void;
  isGeneratingReport: number | null;
  onDownloadQuestionsPdf: (id: number) => void;
}

export function SchedulesTable({
  attempts,
  onEdit,
  onDelete,
  onSubmissions,
  onStats,
  onGenerateReport,
  isGeneratingReport,
  onDownloadQuestionsPdf,
}: SchedulesTableProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'ADMIN';
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000); // Reset after 2 seconds
  };

  const handleDeleteClick = (id: number) => {
    setPendingDeleteId(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (pendingDeleteId !== null) {
      onDelete(pendingDeleteId);
      setPendingDeleteId(null);
      setDeleteDialogOpen(false);
    }
  };

  const cancelDelete = () => {
    setPendingDeleteId(null);
    setDeleteDialogOpen(false);
  };

  return (
    <TooltipProvider>
      <div className="w-full overflow-x-auto">
        <table className="w-full border text-sm">
          <thead>
            <tr className="bg-muted">
              <th className="p-2 text-left w-1/6">Evaluación</th>
              <th className="p-2 text-left w-1/6">Código</th>
              <th className="p-2 text-left w-1/6">Inicio</th>
              <th className="p-2 text-left w-1/6">Fin</th>
              <th className="p-2 text-left w-1/12">Envíos</th>
              <th className="p-2 text-right w-1/4">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {attempts.map((a: Attempt) => (
              <tr key={a.id} className="border-b">
                <td className="p-2 font-medium">{a.evaluation?.title || '-'}</td>
                <td className="p-2">
                  <div className="flex items-center gap-2">
                    <span>{a.uniqueCode}</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() => handleCopy(a.uniqueCode)}
                    >
                      {copiedCode === a.uniqueCode ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </td>
                <td className="p-2">{new Date(a.startTime).toLocaleString('es-ES', { 
                  year: 'numeric', 
                  month: '2-digit', 
                  day: '2-digit', 
                  hour: 'numeric', 
                  minute: '2-digit', 
                  hour12: true 
                })}</td>
                <td className="p-2">{new Date(a.endTime).toLocaleString('es-ES', { 
                  year: 'numeric', 
                  month: '2-digit', 
                  day: '2-digit', 
                  hour: 'numeric', 
                  minute: '2-digit', 
                  hour12: true 
                })}</td>
                <td className="p-2">{a._count.submissions}</td>
                <td className="p-2 text-right">
                  <div className="flex gap-2 justify-end">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onGenerateReport(a.id)}
                          disabled={a._count.submissions === 0 || isGeneratingReport === a.id}
                        >
                          {isGeneratingReport === a.id ? (
                            <Sparkles className="h-4 w-4 animate-pulse text-yellow-400" />
                          ) : (
                            <FileText className="h-4 w-4" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {a._count.submissions === 0 ? <p>No hay envíos para generar un reporte</p> : <p>Generar Reporte IA</p>}
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => onStats(a.id)} disabled={a._count.submissions === 0}>
                          <BarChart3 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {a._count.submissions === 0 ? <p>No hay envíos para ver estadísticas</p> : <p>Ver estadísticas</p>}
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => onDownloadQuestionsPdf(a.id)}>
                          <List className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        Descargar solo preguntas
                      </TooltipContent>
                    </Tooltip>
                    {!isAdmin && (
                      <>
                        <Button variant="outline" size="sm" onClick={() => onEdit(a)}>
                          Editar
                        </Button>
                      </>
                    )}
                    <Button variant="secondary" size="sm" onClick={() => onSubmissions(a.id)}>
                      Envíos
                    </Button>
                    {!isAdmin && (
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteClick(a.id)}>
                        Eliminar
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar esta presentación? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="secondary" onClick={cancelDelete}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmDelete}>Eliminar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}