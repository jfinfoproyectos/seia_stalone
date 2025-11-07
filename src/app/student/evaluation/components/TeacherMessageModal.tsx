"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Megaphone, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { peekLiveStudentMessages, ackLiveStudentMessage, getStudentBlockStatus } from "../actions";

interface TeacherMessageModalProps {
  uniqueCode: string;
  email: string;
}

export function TeacherMessageModal({ uniqueCode, email }: TeacherMessageModalProps) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<{ id: string; content: string; scope?: 'all' | 'individual' } | null>(null);
  const [countdown, setCountdown] = useState(60);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<number | null>(null);
  // Bloqueo
  const [blockOpen, setBlockOpen] = useState(false);
  const [blockCountdown, setBlockCountdown] = useState(0);
  const blockPollRef = useRef<NodeJS.Timeout | null>(null);

  const startCountdown = () => {
    setCountdown(60);
  };

  const closeModal = async () => {
    if (!message) return;
    try {
      await ackLiveStudentMessage({ uniqueCode, email, id: message.id });
    } catch (e) {
      console.error("Ack message error", e);
    } finally {
      setOpen(false);
      setMessage(null);
    }
  };

  const pollMessages = useCallback(async () => {
    if (!uniqueCode || !email) return;
    // Pausar polling si el modal está abierto para no interferir con la lectura
    if (open) return;
    try {
      const res = await peekLiveStudentMessages({ uniqueCode, email });
      if (res?.success && res.messages?.length) {
        const msg = res.messages[0];
        setMessage({ id: msg.id, content: msg.content, scope: msg.scope });
        setOpen(true);
        startCountdown();
      }
    } catch (e) {
      console.error("Polling messages error", e);
    }
  }, [uniqueCode, email, open]);

  useEffect(() => {
    // Start polling every 2 seconds
    // Poll más rápido para entrega casi inmediata
    pollMessages(); // primera comprobación inmediata al montar
    pollRef.current = setInterval(pollMessages, 300);
    // Poll de bloqueo independiente y continuo
    const pollBlock = async () => {
      if (!uniqueCode || !email) return;
      try {
        const res = await getStudentBlockStatus({ uniqueCode, email });
        if (res?.success && res.blocked) {
          const secs = Math.ceil((res.remainingMs ?? 0) / 1000);
          setBlockCountdown(secs);
          setBlockOpen(true);
        } else {
          setBlockOpen(false);
        }
      } catch (e) {
        console.error('Poll block status error', e);
      }
    };
    pollBlock();
    blockPollRef.current = setInterval(pollBlock, 500);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
      if (blockPollRef.current) clearInterval(blockPollRef.current);
      blockPollRef.current = null;
      if (countdownRef.current) clearTimeout(countdownRef.current);
      countdownRef.current = null;
    };
  }, [pollMessages]);

  // Decrementa el contador cada segundo mientras el modal esté abierto
  useEffect(() => {
    if (!open) return;
    if (countdown <= 0) return;
    const id = window.setTimeout(() => {
      setCountdown((c) => Math.max(c - 1, 0));
    }, 1000);
    countdownRef.current = id;
    return () => {
      clearTimeout(id);
    };
  }, [open, countdown]);

  // Decrementa el contador de bloqueo cada segundo mientras esté activo
  useEffect(() => {
    if (!blockOpen) return;
    if (blockCountdown <= 0) {
      setBlockOpen(false);
      return;
    }
    const id = window.setTimeout(() => {
      setBlockCountdown((c) => Math.max(c - 1, 0));
    }, 1000);
    return () => {
      clearTimeout(id);
    };
  }, [blockOpen, blockCountdown]);

  const isBroadcast = message?.scope === 'all';

  // Render del modal de bloqueo (tiene prioridad y no se puede cerrar manualmente)
  if (blockOpen) {
    return (
      <AlertDialog open={true} onOpenChange={() => setBlockOpen(true)}>
        <AlertDialogContent className="max-w-md bg-card text-card-foreground border shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center">Has sido bloqueado temporalmente</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              El profesor ha bloqueado tu interacción.
              <div className="mt-3 text-sm">Tiempo restante: {blockCountdown}s</div>
            </AlertDialogDescription>
          </AlertDialogHeader>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  if (!message) return null;

  return (
    <AlertDialog open={open} onOpenChange={(o) => setOpen(o)}>
      <AlertDialogContent
        className={`max-w-md bg-card text-card-foreground border shadow-xl`}
      >
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center justify-center gap-2 text-center">
            {isBroadcast ? (
              <Megaphone className="h-5 w-5 text-yellow-500 dark:text-yellow-400" />
            ) : (
              <MessageSquare className="h-5 w-5 text-primary" />
            )}
            {isBroadcast ? 'Mensaje para todos' : 'Mensaje del profesor'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            <div className="flex justify-center mt-2">
              {isBroadcast && (
                <Badge variant="secondary" className="text-xs">
                  Todos los estudiantes
                </Badge>
              )}
            </div>
            <div className="mt-3 p-3 rounded-md bg-muted/50 whitespace-pre-wrap text-sm">
              {message.content}
            </div>
            <div className="mt-4 text-center text-xs text-muted-foreground">
              Puedes cerrar en {countdown}s
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction
            onClick={closeModal}
            disabled={countdown > 0}
            className="w-full"
          >
            {countdown > 0 ? `Cerrar (${countdown}s)` : 'Cerrar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}