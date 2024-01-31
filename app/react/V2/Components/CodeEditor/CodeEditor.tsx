import React from 'react';
import loadable from '@loadable/component';
import { CodeEditorProps } from './CodeEditorComponent';

const CodeEditorComponent = loadable(async () => {
  const { CodeEditorComponent: Component } = await import('./CodeEditorComponent');
  return Component;
});

const CodeEditor = ({ language, onMount, code }: CodeEditorProps) => (
  <CodeEditorComponent language={language} onMount={onMount} code={code} />
);

export { CodeEditor };
