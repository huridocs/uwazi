/* eslint-disable react/no-multi-comp */
import React, { useEffect, useRef, useState } from 'react';
import * as monaco from 'monaco-editor';

type CodeEditorInstance = monaco.editor.IStandaloneCodeEditor;

type CodeEditorProps = {
  language: 'html' | 'javascript' | 'css';
  intialValue?: string;
  onMount?: (editor: CodeEditorInstance) => void;
  fallbackElement?: React.ReactElement;
};

const CodeEditorComponent = ({
  language,
  intialValue,
  onMount,
  fallbackElement,
}: CodeEditorProps) => {
  const container = useRef<HTMLDivElement>(null);
  const editor = useRef<CodeEditorInstance>();
  const [hasError, setHasError] = useState(false);

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
            heightInPx: 8,
            domNode: document.createElement('SPAN'),
          });
        });
      } catch (_error) {
        setHasError(true);
      }
    }

    return () => {
      if (editor.current) {
        editor.current.dispose();
      }
    };
  }, [language]);

  useEffect(() => {
    if (onMount && editor.current) {
      onMount(editor.current);
    }
  }, []);

  if (hasError) {
    return fallbackElement || <div />;
  }

  return <div className="w-full h-full border" dir="ltr" ref={container} />;
};

export type { CodeEditorProps, CodeEditorInstance };
export { CodeEditorComponent };
