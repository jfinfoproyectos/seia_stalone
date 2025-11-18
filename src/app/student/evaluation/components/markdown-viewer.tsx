import dynamic from 'next/dynamic';
import { useMarkdownConfig } from '../hooks/useMarkdownConfig';
import { useRef } from 'react';
import type { Components } from 'react-markdown';

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

  const componentsOverrides = {
    a: ({ href, children, ...props }) => (
      <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
        {children}
      </a>
    ),
    pre: ({ children, className, ...props }) => (
      <pre
        {...props}
        className={className}
        style={{
          borderLeft: '3px solid var(--primary)',
          paddingLeft: '0.75rem',
          marginTop: '0.75rem',
          marginBottom: '0.75rem'
        }}
      >
        {children}
      </pre>
    ),
    code: ({ children, className, ...props }) => {
      const isBlock = typeof className === 'string' && /language-/.test(className);
      if (!isBlock) {
        return (
          <code
            {...props}
            className={`font-mono text-[0.85em] px-1.5 py-0.5 rounded-full border bg-primary/15 text-primary border-primary/25 ${className ?? ''}`}
          >
            {children}
          </code>
        );
      }
      return (
        <code {...props} className={className}>
          {children}
        </code>
      );
    }
  } satisfies Components;

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
          className="prose prose-sm max-w-none dark:prose-invert"
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
          components={componentsOverrides}
        />
      </div>
    </div>
  );
};