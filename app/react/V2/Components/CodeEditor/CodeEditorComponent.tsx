/* eslint-disable react/no-multi-comp */
import React, { useEffect, useRef, useState } from 'react';
import { captureException } from '@sentry/react';
import * as monaco from 'monaco-editor';
import { isClient } from 'app/utils';
import { handleUnexpectedError } from 'app/V2/shared/errorUtils';

type CodeEditorInstance = monaco.editor.IStandaloneCodeEditor;

type CodeEditorProps = {
  language: 'html' | 'javascript' | 'css';
  intialValue?: string;
  onMount?: (editor: CodeEditorInstance) => void;
  fallbackElement?: React.ReactElement;
};

const createMonacoEditor = (
  container: HTMLDivElement,
  language: string,
  initialValue?: string
): CodeEditorInstance => {
  const editor = monaco.editor.create(container, {
    value: initialValue,
    language,
    tabSize: 2,
    automaticLayout: true,
    fontFamily: 'Consolas, "Courier New", monospace',
    fontLigatures: false,
  });

  editor.changeViewZones(accessor => {
    accessor.addZone({
      afterLineNumber: 0,
      heightInPx: 8,
      domNode: document.createElement('SPAN'),
    });
  });

  return editor;
};

// eslint-disable-next-line max-statements
const CodeEditorComponent = ({
  language,
  intialValue,
  onMount,
  fallbackElement,
}: CodeEditorProps) => {
  const container = useRef<HTMLDivElement>(null);
  const editor = useRef<CodeEditorInstance>();
  const [hasError, setHasError] = useState(false);
  const [fontsReady, setFontsReady] = useState(false);
  const [editorReady, setEditorReady] = useState(false);

  useEffect(() => {
    if (isClient) {
      document.fonts.ready
        .then(() => {
          monaco.editor.remeasureFonts();
          setFontsReady(true);
        })
        .catch(e => {
          setHasError(true);
          const error = new Error('Code editor error', { cause: e });
          captureException(error);
        });
    } else {
      setFontsReady(true);
    }
  }, []);

  useEffect(() => {
    if (!editor.current && !hasError && fontsReady && container.current) {
      try {
        editor.current = createMonacoEditor(container.current, language, intialValue);
        setEditorReady(true);
      } catch (e) {
        setHasError(true);
        handleUnexpectedError(e, 'Error creating monaco editor');
      }
    }

    return () => {
      if (editor.current) {
        editor.current.dispose();
      }
    };
  }, [language, fontsReady, hasError]);

  useEffect(() => {
    if (onMount && editorReady && editor.current) {
      onMount(editor.current);
    }
  }, [editorReady, onMount]);

  if (hasError) {
    return fallbackElement || <div />;
  }

  return (
    <div className="w-full h-full border monaco-code-editor-container" dir="ltr" ref={container} />
  );
};

export type { CodeEditorProps, CodeEditorInstance };
export { CodeEditorComponent };
