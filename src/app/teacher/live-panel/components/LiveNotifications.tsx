"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, X, AlertTriangle, CheckCircle, Clock, Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface Notification {
  id: string;
  type: "new_student" | "submission" | "warning" | "info";
  title: string;
  message: string;
  timestamp: Date;
  evaluationId?: string;
  studentName?: string;
  read: boolean;
}

interface LiveNotificationsProps {
  enabled: boolean;
  className?: string;
}

export function LiveNotifications({ enabled, className }: LiveNotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Simular notificaciones para demostración
  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      // Simular nuevas notificaciones aleatoriamente
      if (Math.random() > 0.7) {
        const types: Notification["type"][] = ["new_student", "submission", "warning", "info"];
        const type = types[Math.floor(Math.random() * types.length)];
        
        const newNotification: Notification = {
          id: Date.now().toString(),
          type,
          title: getNotificationTitle(type),
          message: getNotificationMessage(type),
          timestamp: new Date(),
          studentName: `Estudiante ${Math.floor(Math.random() * 100) + 1}`,
          evaluationId: `eval_${Math.floor(Math.random() * 10) + 1}`,
          read: false
        };

        setNotifications(prev => [newNotification, ...prev.slice(0, 9)]); // Mantener solo 10 notificaciones
      }
    }, 10000); // Cada 10 segundos

    return () => clearInterval(interval);
  }, [enabled]);

  const getNotificationTitle = (type: Notification["type"]) => {
    switch (type) {
      case "new_student":
        return "Nuevo estudiante";
      case "submission":
        return "Evaluación enviada";
      case "warning":
        return "Advertencia";
      case "info":
        return "Información";
      default:
        return "Notificación";
    }
  };

  const getNotificationMessage = (type: Notification["type"]) => {
    switch (type) {
      case "new_student":
        return "Un estudiante ha comenzado una evaluación";
      case "submission":
        return "Un estudiante ha enviado su evaluación";
      case "warning":
        return "Estudiante ha estado fuera de la evaluación por más de 2 minutos";
      case "info":
        return "Actualización del sistema completada";
      default:
        return "Nueva notificación disponible";
    }
  };

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "new_student":
        return <Users className="w-4 h-4 text-blue-500" />;
      case "submission":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case "info":
  return <Clock className="w-4 h-4 text-muted-foreground" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (!enabled) return null;

  return (
    <div className={`relative ${className}`}>
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="outline"
        size="sm"
        className="relative"
      >
        <Bell className="w-4 h-4 mr-2" />
        Notificaciones
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <Card className="absolute top-full right-0 mt-2 w-80 max-h-96 overflow-hidden z-50 shadow-lg">
          <div className="p-3 border-b flex items-center justify-between">
            <h3 className="font-semibold text-sm">Notificaciones</h3>
            <div className="flex items-center gap-2">
              {notifications.length > 0 && (
                <Button
                  onClick={clearAll}
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                >
                  Limpiar
                </Button>
              )}
              <Button
                onClick={() => setIsOpen(false)}
                variant="ghost"
                size="sm"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <CardContent className="p-0 max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
    <div className="p-4 text-center text-muted-foreground text-sm">
                No hay notificaciones
              </div>
            ) : (
              <div className="divide-y">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
      className={`p-3 hover:bg-accent cursor-pointer transition-colors ${
        !notification.read ? "bg-accent border-l-4 border-l-primary" : ""
      }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-foreground truncate">
                            {notification.title}
                          </p>
                          {!notification.read && (
        <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 ml-2" />
                          )}
                        </div>
        <p className="text-xs text-muted-foreground mt-1">
                          {notification.message}
                        </p>
                        {notification.studentName && (
                          <p className="text-xs text-blue-600 mt-1">
                            {notification.studentName}
                          </p>
                        )}
        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(notification.timestamp, { 
                            addSuffix: true, 
                            locale: es 
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}