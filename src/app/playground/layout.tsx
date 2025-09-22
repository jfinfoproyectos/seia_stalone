import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Playground de Práctica | SEIAC',
  description: 'Genera preguntas personalizadas y practica con evaluación de IA usando tu propia API Key de Gemini',
  keywords: ['práctica', 'preguntas', 'IA', 'Gemini', 'evaluación', 'aprendizaje'],
}

export default function PlaygroundLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}