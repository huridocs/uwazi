import React from 'react';
import { ChevronRightIcon, LanguageIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { Translate, t } from '#app/I18N/index.js';
import type { FoldStep } from './multiLanguageFieldHelpers.js';

type LanguageSummaryControlsProps = {
  step: FoldStep;
  probe: boolean;
  open: boolean;
  idPrefix: string;
  summary: string;
  setText: string;
  emptyText: string;
  shortSummary: string;
  empties: string[];
  canTranslate: boolean;
  disabled: boolean;
  showAutoTranslate: boolean;
  translateTitle: string;
  onToggle: () => void;
  onAutoTranslate: () => void;
};

const LanguageSummaryControls = ({
  step,
  probe,
  open,
  idPrefix,
  summary,
  setText,
  emptyText,
  shortSummary,
  empties,
  canTranslate,
  disabled,
  showAutoTranslate,
  translateTitle,
  onToggle,
  onAutoTranslate,
}: LanguageSummaryControlsProps) => (
  <>
    <button
      type="button"
      tabIndex={probe ? -1 : undefined}
      onClick={probe || disabled ? undefined : onToggle}
      aria-expanded={probe ? undefined : open}
      aria-controls={probe ? undefined : `${idPrefix}-langs`}
      aria-label={t('System', `Languages: ${summary}`, null, false)}
      title={probe ? undefined : summary}
      className="inline-flex h-6 min-w-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-md px-1.5 -ms-1.5 text-meta text-ink-tertiary transition-colors hover:bg-warm hover:text-ink-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-carbon/40"
    >
      <ChevronRightIcon
        className={`h-micro w-micro shrink-0 transition-transform ${open ? 'rotate-90' : ''}`}
        aria-hidden
      />
      <LanguageIcon className="h-micro w-micro shrink-0" aria-hidden />
      {step < 2 && (
        <>
          <span className="shrink-0">
            <Translate>Languages</Translate>
          </span>
          <span className="shrink-0 text-ink-muted">·</span>
        </>
      )}
      {step === 0 ? (
        <span className="grid min-w-0 grid-cols-[minmax(0,max-content)] text-start text-ink-muted tabular-nums">
          <span
            className={`col-start-1 row-start-1 truncate ${empties.length === 0 || probe ? '' : 'invisible'}`}
          >
            {setText}
          </span>
          <span
            className={`col-start-1 row-start-1 truncate ${empties.length > 0 && !probe ? '' : 'invisible'}`}
          >
            {emptyText}
          </span>
        </span>
      ) : (
        <span className="min-w-0 truncate text-start text-ink-muted tabular-nums">
          {shortSummary}
        </span>
      )}
    </button>
    {showAutoTranslate ? (
      <button
        type="button"
        tabIndex={probe ? -1 : undefined}
        onClick={probe || disabled || !canTranslate ? undefined : onAutoTranslate}
        aria-disabled={!canTranslate || undefined}
        aria-label={step === 3 ? t('System', 'Auto-translate', null, false) : undefined}
        title={probe ? undefined : translateTitle}
        className={`inline-flex h-6 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-md border text-meta transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-carbon/40 ${step === 3 ? 'w-6' : 'px-2'} ${
          canTranslate && !disabled
            ? 'cursor-pointer border-carbon/30 bg-carbon-tint/40 text-carbon hover:bg-carbon-tint'
            : 'cursor-default border-border bg-paper text-ink-muted'
        }`}
      >
        <SparklesIcon className="h-micro w-micro shrink-0" aria-hidden />
        {step < 3 && <Translate>Auto-translate</Translate>}
      </button>
    ) : null}
  </>
);

export { LanguageSummaryControls };
