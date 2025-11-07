"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Settings, RefreshCw, Bell, Eye, Clock } from "lucide-react";

interface LivePanelSettingsProps {
  refreshInterval: number;
  onRefreshIntervalChange: (interval: number) => void;
  autoRefresh: boolean;
  onAutoRefreshChange: (enabled: boolean) => void;
  showNotifications?: boolean;
  onShowNotificationsChange?: (enabled: boolean) => void;
  className?: string;
}

export function LivePanelSettings({
  refreshInterval,
  onRefreshIntervalChange,
  autoRefresh,
  onAutoRefreshChange,
  showNotifications = true,
  onShowNotificationsChange,
  className
}: LivePanelSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);

  const refreshIntervalOptions = [
    { value: 1000, label: "1 segundo", description: "Muy frecuente" },
    { value: 3000, label: "3 segundos", description: "Frecuente" },
    { value: 5000, label: "5 segundos", description: "Normal" },
    { value: 10000, label: "10 segundos", description: "Moderado" },
    { value: 30000, label: "30 segundos", description: "Lento" },
    { value: 60000, label: "1 minuto", description: "Muy lento" }
  ];

  const currentOption = refreshIntervalOptions.find(opt => opt.value === refreshInterval);

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        size="sm"
        className={className}
      >
        <Settings className="w-4 h-4 mr-2" />
        Configuración
      </Button>
    );
  }

  return (
    <Card className={`w-80 ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configuración del Panel
          </div>
          <Button
            onClick={() => setIsOpen(false)}
            variant="ghost"
            size="sm"
          >
            ✕
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Auto-refresh */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="auto-refresh" className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Actualización Automática
            </Label>
            <Switch
              id="auto-refresh"
              checked={autoRefresh}
              onCheckedChange={onAutoRefreshChange}
            />
          </div>
  <p className="text-xs text-muted-foreground">
            {autoRefresh 
              ? "Los datos se actualizan automáticamente" 
              : "Actualización manual únicamente"
            }
          </p>
        </div>

        {/* Refresh Interval */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Intervalo de Actualización
          </Label>
          <Select
            value={refreshInterval.toString()}
            onValueChange={(value) => onRefreshIntervalChange(parseInt(value))}
            disabled={!autoRefresh}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {refreshIntervalOptions.map((option) => (
                <SelectItem key={option.value} value={option.value.toString()}>
                  <div className="flex items-center justify-between w-full">
                    <span>{option.label}</span>
                    <Badge variant="outline" className="ml-2 text-xs">
                      {option.description}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {currentOption && (
  <p className="text-xs text-muted-foreground">
              Actualización cada {currentOption.label.toLowerCase()} - {currentOption.description}
            </p>
          )}
        </div>

        {/* Notifications */}
        {onShowNotificationsChange && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="notifications" className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Notificaciones
              </Label>
              <Switch
                id="notifications"
                checked={showNotifications}
                onCheckedChange={onShowNotificationsChange}
              />
            </div>
  <p className="text-xs text-muted-foreground">
              {showNotifications 
                ? "Recibir alertas de nuevos estudiantes y cambios" 
                : "Sin notificaciones"
              }
            </p>
          </div>
        )}

        {/* Performance Info */}
        <div className="pt-3 border-t">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium">Rendimiento</span>
          </div>
  <div className="space-y-1 text-xs text-muted-foreground">
            <p>• Intervalos más cortos consumen más recursos</p>
            <p>• Se recomienda 5 segundos para uso normal</p>
            <p>• El panel se pausa cuando la pestaña no está visible</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="pt-3 border-t">
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={() => onRefreshIntervalChange(3000)}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              Rápido (3s)
            </Button>
            <Button
              onClick={() => onRefreshIntervalChange(10000)}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              Lento (10s)
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}