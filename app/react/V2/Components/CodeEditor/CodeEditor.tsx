import React, { useEffect, useRef } from 'react';
import Editor, { loader } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import type { Monaco } from '@monaco-editor/react';

import { useIsFirstRender } from 'app/V2/CustomHooks/useIsFirstRender';
import { withLazy } from '../componentWrappers';

type CodeEditorInstance = editor.IStandaloneCodeEditor;

type CodeEditorProps = {
  language: 'html' | 'javascript';
  onMount?: (editor: CodeEditorInstance) => void;
  code?: string;
  monaco?: Monaco;
};

const CodeEditorComponent = ({ language, onMount, code, monaco }: CodeEditorProps) => {
  const editorRef = useRef<CodeEditorInstance>();
  const monacoEditorRef = useRef<CodeEditorInstance>();
  const isFirstRender = useIsFirstRender();

  const logLines = () => {
    console.log('CONTENT :', monacoEditorRef.current?.getModel()?.getLinesContent());
  };

  useEffect(() => {
    if (isFirstRender && monaco) {
      loader.config({ monaco });
      const monacoEditor = monaco.editor.create(
        document.getElementById(`editorContainer_${language}`)!,
        {
          value: code,
          language,
          automaticLayout: true,
        }
      );
      monacoEditor.getModel()?.onDidChangeContent(() => {
        logLines();
      });

      monacoEditorRef.current = monacoEditor;
    }
  }, [code, isFirstRender, language, monaco]);

  const handleEditorDidMount = (currentEditor: CodeEditorInstance) => {
    editorRef.current = currentEditor;

    if (onMount && editorRef.current) {
      onMount(editorRef.current);
    }
  };

  return (
    <div className="flex flex-row h-full mb-4">
      <div className="w-1/2 h-full ">
        <h2>@monaco-editor/react</h2>
        <Editor defaultLanguage={language} defaultValue={code} onMount={handleEditorDidMount} />
      </div>
      <div className="w-1/2 h-full">
        <h2>monaco-editor</h2>
        <div className="w-full h-full " id={`editorContainer_${language}`} />
      </div>
    </div>
  );
};

const CodeEditor = withLazy<CodeEditorProps>(
  CodeEditorComponent,
  async () => import('monaco-editor'),
  (module: any) => ({
    monaco: module,
  })
);
export type { CodeEditorProps, CodeEditorInstance };
export { CodeEditor };
