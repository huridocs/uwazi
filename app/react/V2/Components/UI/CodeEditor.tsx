import React from 'react';
import * as monaco from 'monaco-editor';
import Editor, { loader } from '@monaco-editor/react';

loader.config({ monaco });

type CodeEditorProps = {
  language: 'html' | 'javascript';
  code?: string;
};

const CodeEditor = ({ language, code }: CodeEditorProps) => (
  <Editor defaultLanguage={language} defaultValue={code} />
);

export { CodeEditor };
