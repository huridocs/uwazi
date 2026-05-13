import React from 'react';
import type { UseFormRegister, UseFormSetValue } from 'react-hook-form';
import _ from 'lodash';
import { Translate } from '#app/I18N/index.js';
import { Tabs } from '#V2/Components/UI/index.js';
import { CodeEditor } from '#V2/Components/CodeEditor/index.js';
import { Page } from '#V2/shared/types.js';
import { HTMLNotification, JSNotification } from './PageEditorComponents.js';

type DebouncedBinder = (handler: () => void) => ReturnType<typeof _.debounce>;

export interface PageEditorCodeTabsProps {
  page: Page;
  register: UseFormRegister<Page>;
  setValue: UseFormSetValue<Page>;
  debouncedChangeHandler: DebouncedBinder;
  useLegacyMarkdown: boolean;
}

const bindEditorDraftField = (
  editor: { getModel: () => { onDidChangeContent: (cb: () => void) => void } | null; getValue: () => string },
  debouncedChangeHandler: DebouncedBinder,
  setValue: UseFormSetValue<Page>,
  field: 'draft.content' | 'draft.script' | 'draft.css'
) => {
  editor.getModel()?.onDidChangeContent(
    debouncedChangeHandler(() => {
      setValue(field, editor.getValue(), { shouldDirty: true });
    })
  );
};

const PageEditorHtmlTab = ({
  page,
  register,
  setValue,
  debouncedChangeHandler,
  useLegacyMarkdown,
}: PageEditorCodeTabsProps) => (
  <Tabs.Tab id="HTML" key="html" label={<Translate>HTML</Translate>}>
    <div className="flex flex-col h-full gap-2">
      <HTMLNotification useLegacyMarkdown={useLegacyMarkdown} />
      <div className="h-full pt-2">
        <CodeEditor
          language="html"
          intialValue={page.draft?.content ?? page.metadata?.content}
          onMount={(editor: any) => {
            bindEditorDraftField(editor, debouncedChangeHandler, setValue, 'draft.content');
          }}
          fallbackElement={<textarea {...register('draft.content')} className="w-full h-full" />}
        />
      </div>
    </div>
  </Tabs.Tab>
);

const PageEditorJavascriptTab = ({
  page,
  register,
  setValue,
  debouncedChangeHandler,
}: Omit<PageEditorCodeTabsProps, 'useLegacyMarkdown'>) => (
  <Tabs.Tab id="Javascript" label={<Translate>Javascript</Translate>}>
    <div className="flex flex-col h-full gap-2">
      <JSNotification />
      <div className="h-full pt-2">
        <CodeEditor
          language="javascript"
          intialValue={page.draft?.script ?? page.metadata?.script}
          onMount={(editor: any) => {
            bindEditorDraftField(editor, debouncedChangeHandler, setValue, 'draft.script');
          }}
          fallbackElement={<textarea {...register('draft.script')} className="w-full h-full" />}
        />
      </div>
    </div>
  </Tabs.Tab>
);

const PageEditorCssTab = ({
  page,
  register,
  setValue,
  debouncedChangeHandler,
}: Omit<PageEditorCodeTabsProps, 'useLegacyMarkdown'>) => (
  <Tabs.Tab id="CSS" label={<Translate>CSS</Translate>}>
    <div className="flex flex-col h-full gap-2">
      <div className="h-full pt-2">
        <CodeEditor
          language="css"
          intialValue={page.draft?.css ?? page.metadata?.css}
          onMount={(editor: any) => {
            bindEditorDraftField(editor, debouncedChangeHandler, setValue, 'draft.css');
          }}
          fallbackElement={<textarea {...register('draft.css')} className="w-full h-full" />}
        />
      </div>
    </div>
  </Tabs.Tab>
);

export { PageEditorHtmlTab, PageEditorJavascriptTab, PageEditorCssTab };
