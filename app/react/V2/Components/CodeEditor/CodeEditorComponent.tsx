/* eslint-disable react/no-multi-comp */
import React, { useEffect, useRef } from 'react';
import * as monaco from 'monaco-editor';

type CodeEditorInstance = monaco.editor.IStandaloneCodeEditor;

type CodeEditorProps = {
  language: 'html' | 'javascript';
  intialValue?: string;
  onMount?: (editor: CodeEditorInstance) => void;
  fallbackElement?: React.ReactDOM;
};

const CodeEditorComponent = ({
  language,
  intialValue,
  onMount,
  fallbackElement = <div />,
}: CodeEditorProps) => {
  const container = useRef<HTMLDivElement>(null);
  const editor = useRef<CodeEditorInstance>();

  useEffect(() => {
    if (container.current && !editor.current) {
      try {
        editor.current = monaco.editor.create(container.current, {
          value: intialValue,
          language,
          tabSize: 2,
          automaticLayout: true,
        });

        editor.current.changeViewZones(accessor => {
          accessor.addZone({
            afterLineNumber: 0,
            heightInPx: 5,
            domNode: document.createElement('SPAN'),
          });
        });
      } catch (_error) {
        container.current.appendChild(fallbackElement);
      }
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

  return <div className="w-full h-full border" dir="ltr" ref={container} />;
};

export type { CodeEditorProps, CodeEditorInstance };
export { CodeEditorComponent };
