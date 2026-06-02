import React, { type ReactNode } from 'react';
import type { UseFormRegister, UseFormSetValue } from 'react-hook-form';
import { CodeEditor } from '#V2/Components/CodeEditor/index.js';
import { Page } from '#V2/shared/types.js';
import { HTMLNotification, JSNotification } from './PageEditorComponents.js';

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
  onDraftChange: (
    language: string,
    draft: { content?: string; script?: string; css?: string }
  ) => void;
  useLegacyMarkdown: boolean;
  editorLayoutKey: number;
}

const bindEditorDraftField = (
  setValue: UseFormSetValue<Page>,
  field: DraftField,
  value: string
) => {
  setValue(field, value, { shouldDirty: true });
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
  onDraftChange,
  useLegacyMarkdown,
  editorLayoutKey,
}: PageEditorCodePanelProps) => {
  const contentField = `locales.${activeLocale}.draft.content` as DraftField;

  return (
    <PageEditorCodePanelLayout
      notification={<HTMLNotification useLegacyMarkdown={useLegacyMarkdown} />}
    >
      <input type="hidden" {...register(contentField)} />
      <CodeEditor
        key={`html-${activeLocale}-${editorLayoutKey}`}
        language="html"
        intialValue={localeDraft.content ?? ''}
        onChange={(value: string) => {
          bindEditorDraftField(setValue, contentField, value);
          onDraftChange(activeLocale, { content: value });
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
  onDraftChange,
  editorLayoutKey,
}: Omit<PageEditorCodePanelProps, 'useLegacyMarkdown'>) => {
  const scriptField = `locales.${activeLocale}.draft.script` as DraftField;

  return (
    <PageEditorCodePanelLayout notification={<JSNotification />}>
      <input type="hidden" {...register(scriptField)} />
      <CodeEditor
        key={`js-${activeLocale}-${editorLayoutKey}`}
        language="javascript"
        intialValue={localeDraft.script ?? ''}
        onChange={(value: string) => {
          bindEditorDraftField(setValue, scriptField, value);
          onDraftChange(activeLocale, { script: value });
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
  onDraftChange,
  editorLayoutKey,
}: Omit<PageEditorCodePanelProps, 'useLegacyMarkdown'>) => {
  const cssField = `locales.${activeLocale}.draft.css` as DraftField;

  return (
    <PageEditorCodePanelLayout>
      <input type="hidden" {...register(cssField)} />
      <CodeEditor
        key={`css-${activeLocale}-${editorLayoutKey}`}
        language="css"
        intialValue={localeDraft.css ?? ''}
        onChange={(value: string) => {
          bindEditorDraftField(setValue, cssField, value);
          onDraftChange(activeLocale, { css: value });
        }}
        fallbackElement={<textarea {...register(cssField)} className="w-full h-full" />}
      />
    </PageEditorCodePanelLayout>
  );
};

export { PageEditorHtmlPanel, PageEditorJavascriptPanel, PageEditorCssPanel };
