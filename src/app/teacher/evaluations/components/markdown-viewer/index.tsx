import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';
import { useRef } from 'react';
import type { CSSProperties } from 'react';

// Carga diferida del visor de Markdown
const MDPreview = dynamic(
  () => import('@uiw/react-md-editor').then((mod) => mod.default.Markdown),
  { ssr: false }
);

interface MarkdownViewerProps {
  content: string;
}

export const MarkdownViewer = ({ content }: MarkdownViewerProps) => {
  const { theme } = useTheme();
  const viewerRef = useRef<HTMLDivElement>(null);

  // Estilos para el visor de Markdown según el tema
  const getMarkdownStyles = (): CSSProperties => ({
    overflowY: 'auto',
    height: '100%',
    padding: '1rem',
    border: 'none',
    borderRadius: '0',
    color: 'var(--foreground)',
    backgroundColor: theme === 'dark' ? 'var(--secondary)' : 'var(--background)'
  });

  // Para el data-color-mode
  const colorMode = theme === 'dark' ? 'dark' : 'light';

  return (
    <div 
      ref={viewerRef}
      data-color-mode={colorMode}
      className="relative w-full h-full"
    >
      <div className="h-full w-full border border-input rounded-md bg-transparent shadow-xs overflow-hidden">
        <MDPreview
          source={content}
          style={getMarkdownStyles()}
          className="prose prose-sm max-w-none dark:prose-invert"
          components={{
            a: ({ href, children, ...props }) => (
              <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
                {children}
              </a>
            )
          }}
        />
      </div>
    </div>
  );
};
