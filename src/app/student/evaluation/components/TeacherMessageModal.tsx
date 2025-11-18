"use client";

interface TeacherMessageModalProps {
  uniqueCode: string;
  email: string;
}

// Componente deshabilitado: sin UI ni lógica.
export default function TeacherMessageModal(props: TeacherMessageModalProps) {
  void props;
  return null;
}

// Export nombrado para compatibilidad donde se importe como componente nombrado.
export { TeacherMessageModal };