import React, { useEffect, useRef } from 'react';
import * as monaco from 'monaco-editor';

type CodeEditorInstance = monaco.editor.IStandaloneCodeEditor;

type CodeEditorProps = {
  language: 'html' | 'javascript';
  intialValue?: string;
  onMount?: (editor: CodeEditorInstance) => void;
};

const CodeEditorComponent = ({ language, intialValue, onMount }: CodeEditorProps) => {
  const container = useRef<HTMLDivElement>(null);
  const editor = useRef<CodeEditorInstance>();

  useEffect(() => {
    if (container.current && !editor.current) {
      editor.current = monaco.editor.create(container.current, {
        value: intialValue,
        language,
        tabSize: 2,
        automaticLayout: true,
      });
    }

    return () => {
      editor.current?.dispose();
    };
  }, [language]);

  useEffect(() => {
    if (onMount && editor.current) {
      onMount(editor.current);
    }
  }, []);

  return <div className="w-full h-full" ref={container} />;
};

export type { CodeEditorProps, CodeEditorInstance };
export { CodeEditorComponent };
