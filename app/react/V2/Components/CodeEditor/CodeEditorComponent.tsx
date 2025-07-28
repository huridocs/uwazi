/* eslint-disable react/no-multi-comp */
import React, { useEffect, useRef, useState } from 'react';
import { captureException } from '@sentry/react';
import * as monaco from 'monaco-editor';
import { isClient } from 'app/utils';

type CodeEditorInstance = monaco.editor.IStandaloneCodeEditor;

type CodeEditorProps = {
  language: 'html' | 'javascript' | 'css';
  intialValue?: string;
  onMount?: (editor: CodeEditorInstance) => void;
  fallbackElement?: React.ReactElement;
};

const mountEditor = async (callback: () => void) => {
  await document.fonts.ready.then(() => {
    monaco.editor.remeasureFonts();
    callback();
  });
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
      mountEditor(() => {
        editor.current = monaco.editor.create(container.current!, {
          value: intialValue,
          language,
          tabSize: 2,
          automaticLayout: true,
          fontFamily: 'Consolas, "Courier New", monospace',
          fontLigatures: false,
        });

        editor.current.changeViewZones(accessor => {
          accessor.addZone({
            afterLineNumber: 0,
            heightInPx: 8,
            domNode: document.createElement('SPAN'),
          });
        });
      }).catch(e => {
        setHasError(true);
        if (isClient) {
          const error = new Error('Code editor error', { cause: e });
          captureException(error);
        }
      });
    }

    return () => {
      if (editor.current) {
        editor.current.dispose();
      }
    };
  }, [intialValue, language]);

  useEffect(() => {
    if (onMount && editor.current) {
      onMount(editor.current);
    }
  }, []);

  if (hasError) {
    return fallbackElement || <div />;
  }

  return <div className="w-full h-full border !font-mono" dir="ltr" ref={container} />;
};

export type { CodeEditorProps, CodeEditorInstance };
export { CodeEditorComponent };
