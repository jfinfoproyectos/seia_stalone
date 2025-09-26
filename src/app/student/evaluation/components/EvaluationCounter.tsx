'use client';

import { Sparkles, Zap } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface EvaluationCounterProps {
  count: number;
  className?: string;
}

export function EvaluationCounter({ count, className }: EvaluationCounterProps) {
  const getStatusColor = () => {
    if (count === 0) return 'bg-slate-500/10 text-slate-600 border-slate-500/20 dark:bg-slate-400/10 dark:text-slate-400 dark:border-slate-400/20';
    if (count <= 5) return 'bg-blue-500/10 text-blue-600 border-blue-500/20 dark:bg-blue-400/10 dark:text-blue-400 dark:border-blue-400/20';
    if (count <= 10) return 'bg-purple-500/10 text-purple-600 border-purple-500/20 dark:bg-purple-400/10 dark:text-purple-400 dark:border-purple-400/20';
    if (count <= 20) return 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:bg-amber-400/10 dark:text-amber-400 dark:border-amber-400/20';
    return 'bg-red-500/10 text-red-600 border-red-500/20 dark:bg-red-400/10 dark:text-red-400 dark:border-red-400/20';
  };

  const getStatusMessage = () => {
    if (count === 0) return 'Aún no has usado evaluaciones con IA';
    if (count === 1) return '1 evaluación con IA realizada';
    if (count <= 5) return `${count} evaluaciones con IA - Uso moderado`;
    if (count <= 10) return `${count} evaluaciones con IA - Uso frecuente`;
    if (count <= 20) return `${count} evaluaciones con IA - Uso intensivo`;
    return `${count} evaluaciones con IA - Uso muy intensivo`;
  };

  const getIcon = () => {
    if (count === 0) return <Sparkles className="h-3 w-3" />;
    if (count >= 10) return <Zap className="h-3 w-3" />;
    return <Sparkles className="h-3 w-3" />;
  };

  const getTooltipDescription = () => {
    return 'Contador de peticiones realizadas a la API de Gemini para evaluar tus respuestas';
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={cn(
              'flex items-center gap-1 px-2 py-1 text-xs font-medium transition-colors h-7',
              'hover:bg-background/80 cursor-default',
              getStatusColor(),
              className
            )}
          >
            {getIcon()}
            <span>{count}</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent 
          side="bottom" 
          className="max-w-xs bg-popover text-popover-foreground border border-border shadow-lg" 
          sideOffset={5}
        >
          <div className="text-center">
            <p className="font-medium text-foreground">{getStatusMessage()}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {getTooltipDescription()}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}