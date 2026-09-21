import React, { useState } from 'react';
import { Controller, FieldValues, Path, RegisterOptions, useFormContext } from 'react-hook-form';
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import { t, Translate } from '#app/I18N/index.js';
import { Textarea } from '#V2/Components/Forms/index.js';
import { Markdown } from '#V2/Components/Metadata/Components/Markdown.js';
import {
  EntityFieldError,
  EntityFieldLabel,
  getFieldErrorState,
  translationMessageSlot,
} from '../functions/fieldErrorState.js';
import { EntityPdfFillField, type PdfFillTarget } from './EntityPdfFillField.js';
import { EntityTranslationField } from './EntityTranslationField.js';

type MarkdownFieldProps<TFormValues extends FieldValues = FieldValues> = {
  context: string;
  label: string;
  field: Path<TFormValues>;
  registerOptions?: RegisterOptions<TFormValues, Path<TFormValues>>;
  disabled?: boolean;
  pdfFill?: PdfFillTarget;
  translatableName?: string;
};

type MarkdownFieldMode = 'write' | 'preview';

const tabClass = (active: boolean) =>
  `border-b-2 px-3 py-2 text-xs font-medium ${
    active ? 'border-carbon text-ink' : 'border-transparent text-ink-muted'
  }`;

const MarkdownField = <TFormValues extends FieldValues = FieldValues>({
  context,
  label,
  field,
  registerOptions,
  disabled,
  pdfFill,
  translatableName,
}: MarkdownFieldProps<TFormValues>) => {
  const { control, setValue } = useFormContext<TFormValues>();
  const [mode, setMode] = useState<MarkdownFieldMode>('write');

  return (
    <EntityPdfFillField
      field={field}
      setValue={setValue}
      label={label}
      disabled={disabled}
      pdfFill={pdfFill}
    >
      {slot => (
        <Controller
          control={control}
          name={field}
          rules={registerOptions}
          render={({ field: fieldController, fieldState }) => {
            const { showError, message } = getFieldErrorState(fieldState);
            const value = fieldController.value || '';
            const writePanelId = `${field}-panel-write`;
            const previewPanelId = `${field}-panel-preview`;

            return (
              <>
                <div className="flex min-h-4 items-center gap-2">
                  <EntityFieldLabel
                    htmlFor={field}
                    context={context}
                    label={label}
                    required={Boolean(registerOptions?.required)}
                    showError={showError}
                  />
                  {mode === 'write' ? slot?.labelAccessory : null}
                </div>
                <div
                  data-testid="markdown-editor"
                  className={`overflow-hidden rounded-lg border ${
                    showError ? 'border-emphasis' : 'border-border'
                  }`}
                >
                  <div className="flex items-center border-b border-border">
                    <div
                      role="tablist"
                      aria-label={t('System', 'Markdown', null, false)}
                      className="flex"
                    >
                      <button
                        type="button"
                        role="tab"
                        aria-selected={mode === 'write'}
                        aria-controls={writePanelId}
                        className={tabClass(mode === 'write')}
                        onClick={() => setMode('write')}
                      >
                        <Translate>Edit</Translate>
                      </button>
                      <button
                        type="button"
                        role="tab"
                        aria-selected={mode === 'preview'}
                        aria-controls={previewPanelId}
                        className={tabClass(mode === 'preview')}
                        onClick={() => setMode('preview')}
                      >
                        <Translate>Preview</Translate>
                      </button>
                    </div>
                    <a
                      className="ms-auto me-2 shrink-0 rounded-full p-0.5 text-ink-muted transition-colors hover:text-ink"
                      href="https://guides.github.com/features/mastering-markdown/"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={t('System', 'help', null, false)}
                    >
                      <QuestionMarkCircleIcon className="h-3.5 w-3.5" aria-hidden />
                    </a>
                  </div>
                  {mode === 'write' ? (
                    <div id={writePanelId} role="tabpanel">
                      <Textarea
                        id={field}
                        hideLabel
                        value={value}
                        onChange={fieldController.onChange}
                        onBlur={fieldController.onBlur}
                        onFocus={() => slot?.onFocus()}
                        onClick={slot?.onClick}
                        name={fieldController.name}
                        ref={fieldController.ref}
                        disabled={disabled}
                        hasErrors={showError}
                        rows={6}
                        overlay={slot?.overlay}
                        latched={slot?.latched}
                        className="gap-0 [&_textarea]:rounded-none [&_textarea]:border-0 [&_textarea]:focus:border-transparent [&_textarea]:focus:ring-0"
                      />
                    </div>
                  ) : (
                    <div
                      id={previewPanelId}
                      role="tabpanel"
                      data-testid="markdown-preview"
                      className="min-h-36 overflow-auto px-3 py-2 text-sm"
                    >
                      <Markdown values={[{ value }]} />
                    </div>
                  )}
                </div>
                {translatableName ? (
                  <EntityTranslationField
                    propertyName={translatableName}
                    label={label}
                    idPrefix={String(field)}
                    currentValue={value}
                    onCurrentChange={next => fieldController.onChange(next)}
                    multiline
                    messageSlot={translationMessageSlot(showError, message)}
                    disabled={disabled}
                  />
                ) : (
                  <EntityFieldError showError={showError} message={message} />
                )}
              </>
            );
          }}
        />
      )}
    </EntityPdfFillField>
  );
};

export { MarkdownField };
