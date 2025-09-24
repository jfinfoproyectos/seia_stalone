import { useTheme } from 'next-themes';
import { useMonaco } from '@monaco-editor/react';
import { useRef, useEffect } from 'react';
import Monokai from 'monaco-themes/themes/Monokai.json';

const monokaiThemeName = "monokai-custom";
const lightThemeName = "github-light-custom";

export const useMonacoConfig = () => {
  const { theme } = useTheme();
  const monaco = useMonaco();
  const themeInitializedRef = useRef(false);
  const previousThemeRef = useRef(theme);

  useEffect(() => {
    if (monaco && !themeInitializedRef.current) {
      // Configurar soporte para TypeScript, JSX y TSX
      monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
        target: monaco.languages.typescript.ScriptTarget.Latest,
        allowNonTsExtensions: true,
        moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
        module: monaco.languages.typescript.ModuleKind.CommonJS,
        noEmit: true,
        esModuleInterop: true,
        jsx: monaco.languages.typescript.JsxEmit.React,
        reactNamespace: 'React',
        allowJs: true,
        typeRoots: ['node_modules/@types']
      });

      monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: true,
        noSyntaxValidation: true
      });

      // También deshabilitar validaciones para JavaScript
      monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: true,
        noSyntaxValidation: true
      });

      // Registrar lenguajes JSX y TSX si no están registrados
      const languages = monaco.languages.getLanguages();
      if (!languages.find(lang => lang.id === 'jsx')) {
        monaco.languages.register({ id: 'jsx' });
      }
      if (!languages.find(lang => lang.id === 'tsx')) {
        monaco.languages.register({ id: 'tsx' });
      }

      monaco.editor.defineTheme(monokaiThemeName, {
        ...Monokai,
        base: Monokai.base as "vs-dark"
      });
      monaco.editor.defineTheme(lightThemeName, {
        base: "vs" as const,
        inherit: true,
        rules: [
          { token: 'comment', foreground: '008000' },
          { token: 'string', foreground: 'A31515' },
          { token: 'keyword', foreground: '0000FF' },
          { token: 'number', foreground: '098658' },
          { token: 'operator', foreground: '000000' },
          { token: 'function', foreground: '795E26' },
          { token: 'variable', foreground: '001080' },
          { token: 'type', foreground: '267F99' },
          { token: 'class', foreground: '267F99' },
          { token: 'interface', foreground: '267F99' },
          // Reglas específicas para JSX/TSX
          { token: 'tag', foreground: '800000' },
          { token: 'tag.bracket', foreground: '800000' },
          { token: 'attribute.name', foreground: 'FF0000' },
          { token: 'attribute.value', foreground: '0451A5' },
          { token: 'delimiter.html', foreground: '800000' },
          { token: 'metatag', foreground: 'e00000' },
        ],
        colors: {
          'editor.background': '#FFFFFF',
          'editor.foreground': '#252525',
          'editor.lineHighlightBackground': '#eeeeee',
          'editor.selectionBackground': '#add6ff',
          'editor.selectionHighlightBackground': '#add6ff',
          'editorCursor.foreground': '#000000',
          'editorWhitespace.foreground': '#bbbbbb',
          'editorIndentGuide.activeBackground': '#d3d3d3',
          'editor.selectionHighlightBorder': '#dddddd'
        }
      });
      themeInitializedRef.current = true;
    }
    if (monaco && themeInitializedRef.current && previousThemeRef.current !== theme) {
      monaco.editor.setTheme(theme === 'dark' ? monokaiThemeName : lightThemeName);
      previousThemeRef.current = theme;
    }
  }, [monaco, theme]);

  const getEditorOptions = (isMobile: boolean) => ({
    fontSize: isMobile ? 14 : 16,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    wordWrap: 'on',
    smoothScrolling: true,
    fontFamily: 'Fira Mono, monospace',
    lineNumbers: 'on',
    padding: { top: 8, bottom: 8 },
    automaticLayout: true,
    theme: theme === 'dark' ? monokaiThemeName : lightThemeName,
  });

  return { getEditorOptions, currentTheme: theme === 'dark' ? monokaiThemeName : lightThemeName };
};
