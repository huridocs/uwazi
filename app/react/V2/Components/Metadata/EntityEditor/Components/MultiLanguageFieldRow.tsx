import React, { useCallback, type ChangeEvent } from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { Translate, t } from '#app/I18N/index.js';
import { useDebouncedDraft } from '#V2/CustomHooks/useDebouncedDraft.js';
import { UwaziLoader } from '#V2/Components/UI/index.js';
import { languageDir, languageLabel, writeSourceFirstHint } from './multiLanguageFieldHelpers.js';

type MultiLanguageFieldRowProps = {
  language: string;
  current: string;
  label: string;
  idPrefix: string;
  value: string;
  source: string;
  busy: boolean;
  isMachine: boolean;
  multiline: boolean;
  disabled: boolean;
  showRetranslate: boolean;
  serviceUnavailable?: boolean;
  onChange: (language: string, value: string) => void;
  onTranslate: (language: string) => void;
  onUserEdit: (language: string) => void;
};

const inputClass = (isMachine: boolean) =>
  `min-w-0 flex-1 rounded-md border bg-paper px-3 text-sm text-ink placeholder:text-ink-muted transition-shadow focus:border-carbon/40 focus:outline-none focus:ring-2 focus:ring-carbon/20 ${isMachine ? 'border-carbon/30' : 'border-border'}`;

const retranslateTitle = ({
  serviceUnavailable,
  source,
  language,
  current,
  label,
  value,
}: {
  serviceUnavailable: boolean;
  source: string;
  language: string;
  current: string;
  label: string;
  value: string;
}) => {
  if (serviceUnavailable) return t('System', 'Translation service is unavailable', null, false);
  if (!source) return writeSourceFirstHint(current, label);
  return t(
    'System',
    `Re-translate ${languageLabel(language)} from ${languageLabel(current)}${value ? ' — replaces what is there' : ''}`,
    null,
    false
  );
};

const MultiLanguageFieldRow = React.memo(
  ({
    language,
    current,
    label,
    idPrefix,
    value,
    source,
    busy,
    isMachine,
    multiline,
    disabled,
    showRetranslate,
    serviceUnavailable = false,
    onChange,
    onTranslate,
    onUserEdit,
  }: MultiLanguageFieldRowProps) => {
    const fieldId = `${idPrefix}-lang-${language}`;
    const commit = useCallback((next: string) => onChange(language, next), [language, onChange]);
    const { draft, setDraft, commitNow } = useDebouncedDraft(value, commit);
    const onInput = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      onUserEdit(language);
      setDraft(event.target.value);
    };
    const placeholder = t(
      'System',
      `No ${languageLabel(language)} ${label.toLowerCase()} yet`,
      null,
      false
    );
    const ariaLabel = `${languageLabel(language)} ${label.toLowerCase()}`;
    const className = inputClass(isMachine);
    const showStatus = busy || isMachine || showRetranslate;

    return (
      <div className="flex items-start gap-2">
        <label
          htmlFor={fieldId}
          dir={languageDir(language)}
          className="flex h-8 w-18 shrink-0 items-center truncate text-meta font-medium text-ink-tertiary"
        >
          {languageLabel(language)}
        </label>
        {multiline ? (
          <textarea
            id={fieldId}
            dir={languageDir(language)}
            value={draft}
            disabled={disabled}
            onChange={onInput}
            onBlur={() => commitNow(draft)}
            placeholder={placeholder}
            aria-label={ariaLabel}
            rows={3}
            className={`${className} resize-y py-1`}
          />
        ) : (
          <input
            id={fieldId}
            type="text"
            dir={languageDir(language)}
            value={draft}
            disabled={disabled}
            onChange={onInput}
            onBlur={() => commitNow(draft)}
            placeholder={placeholder}
            aria-label={ariaLabel}
            className={`${className} h-8`}
          />
        )}
        {showStatus ? (
          <div className="flex h-8 w-22 shrink-0 items-center justify-end gap-1">
            {busy ? (
              <span className="inline-flex items-center gap-1 text-meta text-ink-tertiary">
                <UwaziLoader size="xs" color="carbon" animate />
                <span aria-live="polite">
                  <Translate>Translating</Translate>
                </span>
              </span>
            ) : (
              <>
                {isMachine ? (
                  <span
                    title={t(
                      'System',
                      'Machine translated — editing this row clears the marker',
                      null,
                      false
                    )}
                    className="inline-flex h-4 items-center rounded-md bg-carbon-tint px-1.5 text-meta leading-none text-carbon"
                  >
                    <Translate>Auto</Translate>
                  </span>
                ) : null}
                {showRetranslate ? (
                  <button
                    type="button"
                    onClick={
                      !source || disabled || serviceUnavailable
                        ? undefined
                        : () => onTranslate(language)
                    }
                    aria-disabled={!source || disabled || serviceUnavailable || undefined}
                    title={retranslateTitle({
                      serviceUnavailable,
                      source,
                      language,
                      current,
                      label,
                      value: draft,
                    })}
                    aria-label={t(
                      'System',
                      `Re-translate ${languageLabel(language)} ${label.toLowerCase()}`,
                      null,
                      false
                    )}
                    className={`flex h-6 w-6 items-center justify-center rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-carbon/40 ${
                      source && !disabled && !serviceUnavailable
                        ? 'cursor-pointer text-ink-muted hover:bg-warm hover:text-ink'
                        : 'cursor-default text-ink-muted/50'
                    }`}
                  >
                    <ArrowPathIcon className="h-micro w-micro" aria-hidden />
                  </button>
                ) : null}
              </>
            )}
          </div>
        ) : null}
      </div>
    );
  }
);

export { MultiLanguageFieldRow };
