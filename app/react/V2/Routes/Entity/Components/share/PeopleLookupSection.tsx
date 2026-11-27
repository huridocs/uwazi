import React from 'react';
import { InformationCircleIcon } from '@heroicons/react/24/outline';
import { t, Translate } from '#app/I18N/index.js';
import { InputError } from '#V2/Components/Forms/InputError.js';
import { shareSectionLabelClass } from './shareUtils.js';

type PeopleLookupSectionProps = {
  lookupTerm: string;
  lookupError: string;
  showLookupHint: boolean;
  disabled: boolean;
  adding: boolean;
  lookupInputRef: React.RefObject<HTMLInputElement | null>;
  onTermChange: (value: string) => void;
  onToggleHint: () => void;
  onAdd: () => Promise<void>;
};

const lookupInputClass = (invalid: boolean, fieldDisabled: boolean) => {
  const classes = [
    'h-9 w-full rounded-md border bg-paper px-2.5 text-sm font-normal text-ink',
    'placeholder:text-sm placeholder:font-normal placeholder:text-ink-muted',
    'focus:border-carbon/40 focus:outline-none focus:ring-2 focus:ring-carbon/20',
    invalid ? 'border-emphasis bg-seal-tint text-seal' : 'border-border',
  ];
  if (fieldDisabled) classes.push('cursor-not-allowed bg-warm text-ink-muted');
  return classes.join(' ');
};

const PeopleLookupSection = ({
  lookupTerm,
  lookupError,
  showLookupHint,
  disabled,
  adding,
  lookupInputRef,
  onTermChange,
  onToggleHint,
  onAdd,
}: PeopleLookupSectionProps) => {
  const fieldDisabled = disabled || adding;
  return (
    <section className="space-y-2 px-5 pt-3">
      <div className="flex items-center gap-1.5">
        <h4 className={shareSectionLabelClass}>
          <Translate>People and groups</Translate>
        </h4>
        <button
          type="button"
          aria-label={t('System', 'Lookup help', null, false)}
          aria-expanded={showLookupHint}
          aria-controls="share-lookup-hint"
          className="inline-flex h-5 w-5 items-center justify-center rounded-full text-ink-tertiary transition-colors hover:bg-warm hover:text-ink-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-carbon/30"
          onClick={onToggleHint}
        >
          <InformationCircleIcon className="h-4 w-4" aria-hidden />
        </button>
      </div>
      <form
        className="flex items-center gap-2"
        onSubmit={event => {
          event.preventDefault();
          onAdd().catch(() => undefined);
        }}
      >
        <div className="min-w-0 flex-1">
          <label htmlFor="share-collaborator-lookup" className="sr-only">
            <Translate>Add people or groups</Translate>
          </label>
          <input
            ref={lookupInputRef}
            id="share-collaborator-lookup"
            value={lookupTerm}
            placeholder={t('System', 'Username, email or group', null, false)}
            autoComplete="off"
            disabled={fieldDisabled}
            aria-invalid={Boolean(lookupError)}
            className={lookupInputClass(Boolean(lookupError), fieldDisabled)}
            onChange={event => onTermChange(event.target.value)}
          />
          {lookupError ? <InputError>{lookupError}</InputError> : null}
        </div>
        <button
          type="submit"
          disabled={fieldDisabled || !lookupTerm.trim()}
          className="h-8 cursor-pointer rounded-md bg-warm px-3 text-xs font-medium text-ink-secondary transition-colors hover:bg-parchment hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Translate>Add</Translate>
        </button>
      </form>
      {showLookupHint ? (
        <p id="share-lookup-hint" className="text-[11px] text-ink-tertiary">
          <Translate>
            Enter the full username, email, or group name. Suggestions are not shown.
          </Translate>
        </p>
      ) : null}
    </section>
  );
};

export type { PeopleLookupSectionProps };
export { PeopleLookupSection };
