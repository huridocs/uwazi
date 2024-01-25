import React from 'react';
import Editor from '@monaco-editor/react';

type CodeEditorProps = {
  language: 'html' | 'javascript';
  code?: string;
};

const CodeEditor = ({ language, code }: CodeEditorProps) => (
  <Editor defaultLanguage={language} defaultValue={code} />
);

export { CodeEditor };
