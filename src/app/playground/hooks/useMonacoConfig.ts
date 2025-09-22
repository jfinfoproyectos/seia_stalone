import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export const useMonacoConfig = () => {
  const { theme } = useTheme();
  const [currentTheme, setCurrentTheme] = useState('vs-dark');

  // Definir temas personalizados
  const defineCustomThemes = (monaco: unknown) => {
    try {
      const monacoEditor = monaco as {
        editor: {
          defineTheme: (name: string, theme: unknown) => void;
        };
      };

      // Tema dracula personalizado
      monacoEditor.editor.defineTheme('dracula', {
        "base": "vs-dark",
        "inherit": true,
        "rules": [
          {
            "background": "282a36",
            "token": ""
          },
          {
            "foreground": "6272a4",
            "token": "comment"
          },
          {
            "foreground": "f1fa8c",
            "token": "string"
          },
          {
            "foreground": "bd93f9",
            "token": "constant.numeric"
          },
          {
            "foreground": "bd93f9",
            "token": "constant.language"
          },
          {
            "foreground": "bd93f9",
            "token": "constant.character"
          },
          {
            "foreground": "bd93f9",
            "token": "constant.other"
          },
          {
            "foreground": "ffb86c",
            "token": "variable.other.readwrite.instance"
          },
          {
            "foreground": "ff79c6",
            "token": "constant.character.escaped"
          },
          {
            "foreground": "ff79c6",
            "token": "constant.character.escape"
          },
          {
            "foreground": "ff79c6",
            "token": "string source"
          },
          {
            "foreground": "ff79c6",
            "token": "string source.ruby"
          },
          {
            "foreground": "ff79c6",
            "token": "keyword"
          },
          {
            "foreground": "ff79c6",
            "token": "storage"
          },
          {
            "foreground": "8be9fd",
            "fontStyle": "italic",
            "token": "storage.type"
          },
          {
            "foreground": "50fa7b",
            "fontStyle": "underline",
            "token": "entity.name.class"
          },
          {
            "foreground": "50fa7b",
            "fontStyle": "italic underline",
            "token": "entity.other.inherited-class"
          },
          {
            "foreground": "50fa7b",
            "token": "entity.name.function"
          },
          {
            "foreground": "ffb86c",
            "fontStyle": "italic",
            "token": "variable.parameter"
          },
          {
            "foreground": "ff79c6",
            "token": "entity.name.tag"
          },
          {
            "foreground": "50fa7b",
            "token": "entity.other.attribute-name"
          },
          {
            "foreground": "8be9fd",
            "token": "support.function"
          },
          {
            "foreground": "8be9fd",
            "fontStyle": "italic",
            "token": "support.constant"
          },
          {
            "foreground": "8be9fd",
            "fontStyle": "italic",
            "token": "support.type"
          },
          {
            "foreground": "8be9fd",
            "fontStyle": "italic",
            "token": "support.class"
          },
          {
            "foreground": "f8f8f0",
            "background": "ff79c6",
            "token": "invalid"
          },
          {
            "foreground": "f8f8f0",
            "background": "bd93f9",
            "token": "invalid.deprecated"
          },
          {
            "foreground": "cfcfc2",
            "token": "meta meta meta meta meta.structure.dictionary.value string"
          },
          {
            "foreground": "bd93f9",
            "token": "meta meta meta meta.structure.dictionary.value string"
          },
          {
            "foreground": "50fa7b",
            "token": "meta meta meta.structure.dictionary.value string"
          },
          {
            "foreground": "ffb86c",
            "token": "meta meta.structure.dictionary.value string"
          }
        ],
        "colors": {
          "editor.foreground": "#f8f8f2",
          "editor.background": "#282a36",
          "editor.selectionBackground": "#44475a",
          "editor.lineHighlightBackground": "#44475a",
          "editorCursor.foreground": "#f8f8f0",
          "editorWhitespace.foreground": "#3B3A32",
          "editorIndentGuide.activeBackground": "#9D550FB0",
          "editor.selectionHighlightBorder": "#222218"
        }
      });

      // Tema claro personalizado
      monacoEditor.editor.defineTheme('light-custom', {
        base: 'vs',
        inherit: true,
        rules: [
          { token: 'comment', foreground: '008000', fontStyle: 'italic' },
          { token: 'keyword', foreground: '0000ff' },
          { token: 'string', foreground: 'a31515' },
          { token: 'number', foreground: '098658' },
          { token: 'type', foreground: '267f99' },
          { token: 'function', foreground: '795e26' },
          { token: 'variable', foreground: '001080' },
          { token: 'operator', foreground: '0000ff' },
        ],
        colors: {
          'editor.background': '#ffffff',
          'editor.foreground': '#000000',
          'editor.lineHighlightBackground': '#f0f0f0',
          'editor.selectionBackground': '#add6ff',
          'editorCursor.foreground': '#000000',
          'editorWhitespace.foreground': '#bfbfbf',
          'editorIndentGuide.background': '#d3d3d3',
          'editorLineNumber.foreground': '#237893',
        }
      });
    } catch (error) {
      console.error('[useMonacoConfig] Error al definir temas personalizados:', error);
    }
  };

  // Aplicar tema según el modo oscuro/claro
  useEffect(() => {
    try {
      if (theme === 'dark') {
        setCurrentTheme('dracula');
      } else {
        setCurrentTheme('light-custom');
      }
    } catch (error) {
      console.error('[useMonacoConfig] Error al aplicar tema:', error);
      setCurrentTheme('vs-dark'); // Tema por defecto
    }
  }, [theme]);

  // Configuración del editor
  const getEditorOptions = (isMobile: boolean = false) => {
    try {
      return {
        minimap: { enabled: false },
        fontSize: isMobile ? 12 : 14,
        wordWrap: 'on' as const,
        mouseWheelZoom: true,
        readOnly: false,
        domReadOnly: false,
        contextmenu: true, // Deshabilitar menú contextual por seguridad
        lineNumbers: 'on' as const,
        automaticLayout: true,
        scrollBeyondLastLine: false,
        renderWhitespace: 'selection' as const,
        tabSize: 2,
        insertSpaces: true,
        detectIndentation: true,
        folding: true,
        foldingStrategy: 'indentation' as const,
        showFoldingControls: 'always' as const,
        unfoldOnClickAfterEndOfLine: false,
        bracketPairColorization: {
          enabled: true
        },
        guides: {
          bracketPairs: false,
          indentation: true
        },
        suggest: {
          showKeywords: true,
          showSnippets: true,
          showFunctions: true,
          showConstructors: true,
          showFields: true,
          showVariables: true,
          showClasses: true,
          showStructs: true,
          showInterfaces: true,
          showModules: true,
          showProperties: true,
          showEvents: true,
          showOperators: true,
          showUnits: true,
          showValues: true,
          showConstants: true,
          showEnums: true,
          showEnumMembers: true,
          showColors: true,
          showFiles: true,
          showReferences: true,
          showFolders: true,
          showTypeParameters: true,
          showUsers: true,
          showIssues: true,
        },
        quickSuggestions: {
          other: true,
          comments: false,
          strings: false
        },
        parameterHints: {
          enabled: true
        },
        hover: {
          enabled: true
        }
      };
    } catch (error) {
      console.error('[useMonacoConfig] Error al obtener opciones del editor:', error);
      // Retornar configuración mínima en caso de error
      return {
        minimap: { enabled: false },
        fontSize: 14,
        wordWrap: 'on' as const,
        mouseWheelZoom: true,
        readOnly: false,
        contextmenu: false,
        lineNumbers: 'on' as const,
        automaticLayout: true
      };
    }
  };

  return {
    currentTheme,
    getEditorOptions,
    defineCustomThemes
  };
};