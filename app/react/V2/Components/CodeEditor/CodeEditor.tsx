import React from 'react';
import loadable from '@loadable/component';

import { Translate } from '#app/I18N/index.js';
import { CodeEditorProps } from '#V2/Components/CodeEditor/CodeEditorComponent.jsx';

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
