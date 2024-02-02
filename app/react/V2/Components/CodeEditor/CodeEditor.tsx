import React from 'react';
import loadable from '@loadable/component';
import { CodeEditorProps } from './CodeEditorComponent';

const CodeEditorComponent = loadable(async () => {
  const { CodeEditorComponent: Component } = await import('./CodeEditorComponent');
  return Component;
});

// eslint-disable-next-line react/jsx-props-no-spreading
const CodeEditor = (props: CodeEditorProps) => <CodeEditorComponent {...props} />;

export { CodeEditor };
