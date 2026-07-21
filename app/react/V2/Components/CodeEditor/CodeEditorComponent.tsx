/* eslint-disable react/no-multi-comp */
import React, { useEffect, useRef, useState } from 'react';
import { captureException } from '@sentry/react';
import * as monaco from 'monaco-editor';
import { isClient } from '#app/utils/index.js';
import { handleUnexpectedError } from '#app/V2/shared/errorUtils.js';

type CodeEditorInstance = monaco.editor.IStandaloneCodeEditor;

type CodeEditorProps = {
  language: 'html' | 'javascript' | 'css' | 'json';
  intialValue?: string;
  onMount?: (editor: CodeEditorInstance) => void;
  onChange?: (value: string) => void;
  fallbackElement?: React.ReactElement;
};

type MonacoEnvironmentConfig = {
  getWorker?: (_workerId: string, label: string) => Worker;
};

const isMonacoEnvironmentConfig = (value: unknown): value is MonacoEnvironmentConfig =>
  typeof value === 'object' && value !== null;

const getWorkerFile = (label: string) => {
  if (label === 'json') return 'json.worker.js';
  if (label === 'css' || label === 'scss' || label === 'less') return 'css.worker.js';
  if (label === 'html' || label === 'handlebars' || label === 'razor') return 'html.worker.js';
  if (label === 'typescript' || label === 'javascript') return 'ts.worker.js';
  return 'editor.worker.js';
};

const getWorkerBaseOrigin = () => {
  const scriptSources = Array.from(document.querySelectorAll('script[src]'))
    .map(script => script.getAttribute('src'))
    .filter((src): src is string => Boolean(src));
  const scriptUrls = scriptSources.map(src => new URL(src, window.location.origin));
  const crossOriginScript = scriptUrls.find(url => url.origin !== window.location.origin);
  return crossOriginScript ? crossOriginScript.origin : window.location.origin;
};

const createMonacoWorker = (fileName: string) => {
  const baseOrigin = getWorkerBaseOrigin();
  const workerUrl = new URL(`/${fileName}`, `${baseOrigin}/`).toString();
  if (baseOrigin === window.location.origin) {
    return new Worker(workerUrl, { type: 'classic' });
  }
  const bootstrap = `importScripts(${JSON.stringify(workerUrl)});`;
  const blob = new Blob([bootstrap], { type: 'text/javascript' });
  return new Worker(URL.createObjectURL(blob), { type: 'classic' });
};

const configureMonacoEnvironment = () => {
  const currentEnvironment = Reflect.get(globalThis, 'MonacoEnvironment');
  const existing = isMonacoEnvironmentConfig(currentEnvironment) ? currentEnvironment : {};
  Reflect.set(globalThis, 'MonacoEnvironment', {
    ...existing,
    getWorker: (_workerId: string, label: string) => createMonacoWorker(getWorkerFile(label)),
  });
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
  onChange,
  fallbackElement,
}: CodeEditorProps) => {
  const container = useRef<HTMLDivElement>(null);
  const editor = useRef<CodeEditorInstance>();
  const onChangeRef = useRef<CodeEditorProps['onChange']>();
  const [hasError, setHasError] = useState(false);
  const [fontsReady, setFontsReady] = useState(false);
  const [editorReady, setEditorReady] = useState(false);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (isClient) {
      configureMonacoEnvironment();
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
        if (onChangeRef.current) {
          onChangeRef.current(editor.current.getValue());
          editor.current.getModel()?.onDidChangeContent(() => {
            onChangeRef.current?.(editor.current?.getValue() ?? '');
          });
        }
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
