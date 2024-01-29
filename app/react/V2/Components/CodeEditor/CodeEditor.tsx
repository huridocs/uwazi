import React, { useRef } from 'react';
import * as monaco from 'monaco-editor';
import Editor, { loader } from '@monaco-editor/react';

loader.config({ monaco });

type CodeEditorInstance = monaco.editor.IStandaloneCodeEditor;

type CodeEditorProps = {
  language: 'html' | 'javascript';
  onMount?: (editor: CodeEditorInstance) => void;
  code?: string;
};

const CodeEditor = ({ language, onMount, code }: CodeEditorProps) => {
  const editorRef = useRef<CodeEditorInstance>();

  const handleEditorDidMount = (editor: CodeEditorInstance) => {
    editorRef.current = editor;

    if (onMount && editorRef.current) {
      onMount(editorRef.current);
    }
  };

  return <Editor defaultLanguage={language} defaultValue={code} onMount={handleEditorDidMount} />;
};

export type { CodeEditorProps, CodeEditorInstance };
export { CodeEditor };
