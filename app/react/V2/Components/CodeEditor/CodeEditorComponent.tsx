import React, { useCallback, useEffect, useRef } from 'react';
import * as monaco from 'monaco-editor';

type CodeEditorInstance = monaco.editor.IStandaloneCodeEditor;

type CodeEditorProps = {
  language: 'html' | 'javascript';
  getEditor?: (editor: CodeEditorInstance) => void;
  code?: string;
};

const CodeEditorComponent = ({ language, getEditor, code }: CodeEditorProps) => {
  const container = useRef<HTMLDivElement>(null);
  const editor = useRef<CodeEditorInstance>();

  const handleGetEditor = useCallback(() => {
    if (getEditor && editor.current) {
      getEditor(editor.current);
    }
  }, [getEditor]);

  useEffect(() => {
    if (container.current) {
      editor.current = monaco.editor.create(container.current, {
        value: code,
        language,
        tabSize: 2,
        automaticLayout: true,
      });
    }

    return () => {
      editor.current?.dispose();
    };
  }, [code, language]);

  useEffect(() => {
    handleGetEditor();
  }, [handleGetEditor]);

  return <div className="w-full h-full" ref={container} />;
};

export type { CodeEditorProps, CodeEditorInstance };
export { CodeEditorComponent };
