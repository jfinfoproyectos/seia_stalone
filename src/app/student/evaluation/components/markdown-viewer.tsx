import dynamic from 'next/dynamic';
import { useMarkdownConfig } from '../hooks/useMarkdownConfig';
import { useRef } from 'react';

// Carga diferida del visor de Markdown
const MDPreview = dynamic(
  () => import('@uiw/react-md-editor').then((mod) => mod.default.Markdown),
  { ssr: false }
);

interface MarkdownViewerProps {
  content: string;
}

export const MarkdownViewer = ({ content }: MarkdownViewerProps) => {
  const { getMarkdownStyles, colorMode } = useMarkdownConfig();
  const viewerRef = useRef<HTMLDivElement>(null);

  return (
    <div 
      ref={viewerRef}
      data-color-mode={colorMode} 
      className="absolute inset-0 mx-3 sm:mx-4"
      style={{
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none'
      }}
    >
      <div className="h-full w-full border border-input rounded-md bg-transparent shadow-xs overflow-hidden">
        <MDPreview
          source={content}
          // Desactivar el botón de copiar código en bloques Markdown
          disableCopy={true}
          style={{
            ...getMarkdownStyles(),
            overflowY: 'auto',
            height: '100%',
            padding: '1rem',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            MozUserSelect: 'none',
            msUserSelect: 'none',
            border: 'none',
            borderRadius: '0',
            backgroundColor: 'transparent'
          }}
        />
      </div>
    </div>
  );
};