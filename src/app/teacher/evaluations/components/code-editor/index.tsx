import dynamic from 'next/dynamic';
import React, { useRef } from 'react';
import { useMonacoConfig } from './useMonacoConfig';
import type { editor } from 'monaco-editor';

// Carga diferida del editor Monaco
const MonacoEditor = dynamic(
  () => import('@monaco-editor/react').then((mod) => mod.default),
  { ssr: false }
);

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: string;
  height?: string;
}

export const CodeEditor = ({ value, onChange, language, height = '100%' }: CodeEditorProps) => {
  const { getEditorOptions, currentTheme } = useMonacoConfig();
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  // Mapear lenguajes JSX/TSX a sus equivalentes de Monaco
  const getMonacoLanguage = (lang: string) => {
    switch (lang) {
      case 'jsx':
        return 'javascript'; // JSX se maneja como JavaScript con configuración especial
      case 'tsx':
        return 'typescript'; // TSX se maneja como TypeScript con configuración especial
      default:
        return lang;
    }
  };

  return (
    <div className="absolute inset-0 m-3 sm:m-4">
      <div className="h-full w-full border border-input rounded-md bg-transparent shadow-xs transition-[color,box-shadow] focus-within:border-ring focus-within:ring-1 focus-within:ring-ring overflow-hidden">
        <MonacoEditor
          height={height}
          language={getMonacoLanguage(language)}
          value={value}
          onChange={(value) => onChange(value || '')}
          options={{
            ...getEditorOptions(window.innerWidth < 640),
            padding: { top: 8, bottom: 8 },
            lineNumbers: 'on',
            wordWrap: 'on',
          }}
          theme={currentTheme}
          defaultValue=""
          loading={<div className="flex items-center justify-center h-full w-full bg-background rounded-lg">Cargando editor...</div>}
          onMount={(editor, monaco) => {
            editorRef.current = editor;
            editor.onKeyDown((e) => {
              if ((e.ctrlKey || e.metaKey) && (e.keyCode === monaco.KeyCode.KeyC || e.keyCode === monaco.KeyCode.KeyV || e.keyCode === monaco.KeyCode.KeyX)) {
                e.preventDefault();
                e.stopPropagation();
                return false;
              }
            });
          }}
        />
      </div>
    </div>
  );
};
