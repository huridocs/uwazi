import React, { type ReactNode } from 'react';
import type { UseFormRegister, UseFormSetValue } from 'react-hook-form';
import _ from 'lodash';
import { CodeEditor } from '#V2/Components/CodeEditor/index.js';
import { Page } from '#V2/shared/types.js';
import { HTMLNotification, JSNotification } from './PageEditorComponents.js';

type DebouncedBinder = (handler: () => void) => ReturnType<typeof _.debounce>;

type DraftField =
  | `locales.${string}.draft.content`
  | `locales.${string}.draft.script`
  | `locales.${string}.draft.css`;

export interface PageEditorCodePanelProps {
  activeLocale: string;
  localeDraft: {
    content?: string;
    script?: string;
    css?: string;
  };
  register: UseFormRegister<Page>;
  setValue: UseFormSetValue<Page>;
  debouncedChangeHandler: DebouncedBinder;
  useLegacyMarkdown: boolean;
  editorLayoutKey: number;
}

const bindEditorDraftField = (
  editor: {
    getModel: () => { onDidChangeContent: (cb: () => void) => void } | null;
    getValue: () => string;
  },
  debouncedChangeHandler: DebouncedBinder,
  setValue: UseFormSetValue<Page>,
  field: DraftField
) => {
  editor.getModel()?.onDidChangeContent(
    debouncedChangeHandler(() => {
      setValue(field, editor.getValue(), { shouldDirty: true });
    })
  );
};

const PageEditorCodePanelLayout = ({
  notification,
  children,
}: {
  notification?: ReactNode;
  children: ReactNode;
}) => (
  <div className="flex h-full min-h-0 flex-col gap-2">
    {notification ? <div className="shrink-0">{notification}</div> : null}
    <div className="min-h-0 flex-1 pt-2">{children}</div>
  </div>
);

const PageEditorHtmlPanel = ({
  activeLocale,
  localeDraft,
  register,
  setValue,
  debouncedChangeHandler,
  useLegacyMarkdown,
  editorLayoutKey,
}: PageEditorCodePanelProps) => {
  const contentField = `locales.${activeLocale}.draft.content` as DraftField;

  return (
    <PageEditorCodePanelLayout
      notification={<HTMLNotification useLegacyMarkdown={useLegacyMarkdown} />}
    >
      <CodeEditor
        key={`html-${activeLocale}-${editorLayoutKey}`}
        language="html"
        intialValue={localeDraft.content ?? ''}
        onMount={(editor: any) => {
          bindEditorDraftField(editor, debouncedChangeHandler, setValue, contentField);
        }}
        fallbackElement={<textarea {...register(contentField)} className="w-full h-full" />}
      />
    </PageEditorCodePanelLayout>
  );
};

const PageEditorJavascriptPanel = ({
  activeLocale,
  localeDraft,
  register,
  setValue,
  debouncedChangeHandler,
  editorLayoutKey,
}: Omit<PageEditorCodePanelProps, 'useLegacyMarkdown'>) => {
  const scriptField = `locales.${activeLocale}.draft.script` as DraftField;

  return (
    <PageEditorCodePanelLayout notification={<JSNotification />}>
      <CodeEditor
        key={`js-${activeLocale}-${editorLayoutKey}`}
        language="javascript"
        intialValue={localeDraft.script ?? ''}
        onMount={(editor: any) => {
          bindEditorDraftField(editor, debouncedChangeHandler, setValue, scriptField);
        }}
        fallbackElement={<textarea {...register(scriptField)} className="w-full h-full" />}
      />
    </PageEditorCodePanelLayout>
  );
};

const PageEditorCssPanel = ({
  activeLocale,
  localeDraft,
  register,
  setValue,
  debouncedChangeHandler,
  editorLayoutKey,
}: Omit<PageEditorCodePanelProps, 'useLegacyMarkdown'>) => {
  const cssField = `locales.${activeLocale}.draft.css` as DraftField;

  return (
    <PageEditorCodePanelLayout>
      <CodeEditor
        key={`css-${activeLocale}-${editorLayoutKey}`}
        language="css"
        intialValue={localeDraft.css ?? ''}
        onMount={(editor: any) => {
          bindEditorDraftField(editor, debouncedChangeHandler, setValue, cssField);
        }}
        fallbackElement={<textarea {...register(cssField)} className="w-full h-full" />}
      />
    </PageEditorCodePanelLayout>
  );
};

export { PageEditorHtmlPanel, PageEditorJavascriptPanel, PageEditorCssPanel };
