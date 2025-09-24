import React from 'react';
import loadable from '@loadable/component';
// @ts-expect-error TS(2307): Cannot find module '../../I18N/index.js' or its co... Remove this comment to see the full error message
import { Translate } from '../../I18N/index.js';
import { CodeEditorProps } from './CodeEditorComponent';

const CodeEditorComponent = loadable(
  async () => {
    const { CodeEditorComponent: Component } = await import(
      /* webpackChunkName: "LazyLoadMonacoEditor" */ './CodeEditorComponent'
    );
    return Component;
  },
  {
    fallback: (
      <div className="w-full text-center">
        <Translate>Loading</Translate>&nbsp;...
      </div>
    ),
  }
);

// eslint-disable-next-line react/jsx-props-no-spreading
const CodeEditor = (props: CodeEditorProps) => <CodeEditorComponent {...props} />;

export { CodeEditor };
