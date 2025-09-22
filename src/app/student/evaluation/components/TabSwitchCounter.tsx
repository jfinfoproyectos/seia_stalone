'use client';

import { Eye, EyeOff } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface TabSwitchCounterProps {
  count: number;
  className?: string;
}

export function TabSwitchCounter({ count, className }: TabSwitchCounterProps) {
  const getStatusColor = () => {
    if (count === 0) return 'bg-green-500/10 text-green-600 border-green-500/20';
    if (count <= 2) return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
    if (count <= 5) return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
    return 'bg-red-500/10 text-red-600 border-red-500/20';
  };

  const getStatusMessage = () => {
    if (count === 0) return 'Sin cambios de pestaña detectados';
    if (count === 1) return '1 cambio de pestaña detectado';
    if (count <= 2) return `${count} cambios de pestaña - Nivel aceptable`;
    if (count <= 5) return `${count} cambios de pestaña - Nivel de advertencia`;
    return `${count} cambios de pestaña - Nivel crítico`;
  };

  const getIcon = () => {
    if (count === 0) return <Eye className="h-3 w-3" />;
    return <EyeOff className="h-3 w-3" />;
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
              Se registra cada vez que cambias de pestaña o ventana durante la evaluación
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}