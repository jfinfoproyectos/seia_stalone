'use client';

import { useEffect } from 'react';

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {


    // Función para deshabilitar teclas de acceso rápido
    const disableKeyboardShortcuts = (e: KeyboardEvent) => {
      // Deshabilitar F12 (DevTools)
      if (e.key === 'F12') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      
      // Deshabilitar Ctrl+Shift+I (DevTools)
      if (e.ctrlKey && e.shiftKey && e.key === 'I') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      
      // Deshabilitar Ctrl+U (Ver código fuente)
      if (e.ctrlKey && e.key === 'u') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      
      // Deshabilitar Ctrl+Shift+C (Inspeccionar elemento)
      if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      
      // Deshabilitar Ctrl+Shift+J (Consola)
      if (e.ctrlKey && e.shiftKey && e.key === 'J') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    // Función para deshabilitar selección de texto
    const disableTextSelection = (e: Event) => {
      e.preventDefault();
      return false;
    };

    // Función para deshabilitar arrastrar y soltar
    const disableDragAndDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    // Agregar event listeners

    document.addEventListener('keydown', disableKeyboardShortcuts);
    document.addEventListener('selectstart', disableTextSelection);
    document.addEventListener('dragstart', disableDragAndDrop);
    document.addEventListener('drop', disableDragAndDrop);

    // Deshabilitar selección con CSS
    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';
    // Propiedades específicas del navegador
    const bodyStyle = document.body.style as CSSStyleDeclaration & {
      msUserSelect?: string;
      mozUserSelect?: string;
    };
    bodyStyle.msUserSelect = 'none';
    bodyStyle.mozUserSelect = 'none';

    // Cleanup function
    return () => {

      document.removeEventListener('keydown', disableKeyboardShortcuts);
      document.removeEventListener('selectstart', disableTextSelection);
      document.removeEventListener('dragstart', disableDragAndDrop);
      document.removeEventListener('drop', disableDragAndDrop);
      
      // Restaurar selección de texto
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
      // Restaurar propiedades específicas del navegador
      const bodyStyle = document.body.style as CSSStyleDeclaration & {
        msUserSelect?: string;
        mozUserSelect?: string;
      };
      bodyStyle.msUserSelect = '';
      bodyStyle.mozUserSelect = '';
    };
  }, []);

  return (
    <div style={{ userSelect: 'none', WebkitUserSelect: 'none' } as React.CSSProperties}>
      {children}
    </div>
  );
}