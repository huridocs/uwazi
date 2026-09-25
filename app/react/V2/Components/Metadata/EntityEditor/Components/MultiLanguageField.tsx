import React, { useState, type ReactNode } from 'react';
import { useFoldStep } from './useFoldStep.js';
import { languageRowSummary, type FoldStep } from './multiLanguageFieldHelpers.js';
import { LanguageSummaryControls } from './LanguageSummaryControls.js';
import { MultiLanguageFieldRow } from './MultiLanguageFieldRow.js';
import { useFieldTranslate } from './useFieldTranslate.js';

type MultiLanguageFieldProps = {
  label: string;
  idPrefix: string;
  languages: string[];
  current: string;
  values: Record<string, string>;
  onChange: (language: string, value: string) => void;
  onTranslate?: (language: string) => Promise<string>;
  multiline?: boolean;
  messageSlot?: ReactNode;
  disabled?: boolean;
  serviceUnavailable?: boolean;
};

const MultiLanguageField = React.memo(
  ({
    label,
    idPrefix,
    languages,
    current,
    values,
    onChange,
    onTranslate,
    multiline = false,
    messageSlot,
    disabled = false,
    serviceUnavailable = false,
  }: MultiLanguageFieldProps) => {
    const [open, setOpen] = useState(false);
    const { working, machine, translate, markUser } = useFieldTranslate({
      onChange,
      onTranslate,
      disabled,
      source: values[current] ?? '',
    });
    const { others, source, empties, canTranslate, setText, emptyText, summary, translateTitle } =
      languageRowSummary({
        languages,
        current,
        values,
        working,
        onTranslate,
        label,
        serviceAvailable: !serviceUnavailable,
      });
    const { step, availRef, probe0, probe1, probe2 } = useFoldStep();

    const controls = (s: FoldStep, probe: boolean) => (
      <LanguageSummaryControls
        step={s}
        probe={probe}
        open={open}
        idPrefix={idPrefix}
        summary={summary}
        setText={setText}
        emptyText={emptyText}
        shortSummary={`${others.length - empties.length}/${others.length}`}
        empties={empties}
        canTranslate={canTranslate}
        disabled={disabled}
        showAutoTranslate={Boolean(onTranslate)}
        translateTitle={translateTitle}
        serviceUnavailable={serviceUnavailable}
        onToggle={() => setOpen(value => !value)}
        onAutoTranslate={() => {
          setOpen(true);
          empties.forEach(language => {
            void translate(language);
          });
        }}
      />
    );

    return (
      <div className="relative">
        <div ref={availRef} className="-mt-1 flex h-6 min-w-0 items-center gap-2">
          {controls(step, false)}
          {messageSlot ? <div className="min-w-0 truncate">{messageSlot}</div> : null}
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-s-0 top-0 h-0 w-0 overflow-hidden"
          style={{ visibility: 'hidden' }}
        >
          <div ref={probe0} className="flex h-6 w-max items-center gap-2">
            {controls(0, true)}
          </div>
          <div ref={probe1} className="flex h-6 w-max items-center gap-2">
            {controls(1, true)}
          </div>
          <div ref={probe2} className="flex h-6 w-max items-center gap-2">
            {controls(2, true)}
          </div>
        </div>
        {open ? (
          <div id={`${idPrefix}-langs`} className="mt-1 space-y-1">
            {others.map(language => (
              <MultiLanguageFieldRow
                key={language}
                language={language}
                current={current}
                label={label}
                idPrefix={idPrefix}
                value={values[language] ?? ''}
                source={source}
                busy={working.includes(language)}
                isMachine={Boolean(machine[language]) && !working.includes(language)}
                multiline={multiline}
                disabled={disabled}
                showRetranslate={Boolean(onTranslate)}
                serviceUnavailable={serviceUnavailable}
                onChange={onChange}
                onTranslate={next => {
                  void translate(next);
                }}
                onUserEdit={markUser}
              />
            ))}
          </div>
        ) : null}
      </div>
    );
  }
);

export { MultiLanguageField };
export type { MultiLanguageFieldProps };
