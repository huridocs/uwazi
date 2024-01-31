import React, { useEffect, useRef } from 'react';
import * as monaco from 'monaco-editor';

type CodeEditorInstance = monaco.editor.IStandaloneCodeEditor;

type CodeEditorProps = {
  language: 'html' | 'javascript';
  onMount?: (editor: CodeEditorInstance) => void;
  code?: string;
};

const CodeEditorComponent = ({ language, onMount, code }: CodeEditorProps) => {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let editor: monaco.editor.IStandaloneCodeEditor;

    if (container.current) {
      editor = monaco.editor.create(container.current, {
        value: code,
        language,
        tabSize: 2,
        automaticLayout: true,
      });
    }

    return () => {
      editor.dispose();
    };
  }, [code, language]);

  return <div className="w-full h-full" ref={container} />;
};

export type { CodeEditorProps, CodeEditorInstance };
export { CodeEditorComponent };
