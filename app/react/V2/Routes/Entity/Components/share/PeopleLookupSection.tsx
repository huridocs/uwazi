import React from 'react';
import { InformationCircleIcon } from '@heroicons/react/24/outline';
import { t, Translate } from '#app/I18N/index.js';
import { InputField } from '#V2/Components/Forms/index.js';
import { Button } from '#V2/Components/UI/index.js';

type PeopleLookupSectionProps = {
  lookupTerm: string;
  lookupError: string;
  showLookupHint: boolean;
  disabled: boolean;
  adding: boolean;
  lookupInputRef: React.RefObject<HTMLInputElement>;
  onTermChange: (value: string) => void;
  onToggleHint: () => void;
  onAdd: () => Promise<void>;
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
}: PeopleLookupSectionProps) => (
  <section className="space-y-3 px-5 pt-3">
    <div className="flex items-center gap-1.5">
      <h4 className="text-xs font-medium text-ink-secondary">
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
      <InputField
        ref={lookupInputRef}
        id="share-collaborator-lookup"
        label={<Translate>Add people or groups</Translate>}
        hideLabel
        value={lookupTerm}
        placeholder={t('System', 'Username, email or group', null, false)}
        autoComplete="off"
        disabled={disabled || adding}
        hasErrors={Boolean(lookupError)}
        errorMessage={lookupError || undefined}
        className="min-w-0 flex-1"
        onChange={event => onTermChange(event.target.value)}
      />
      <Button
        type="submit"
        variant="warm"
        size="small"
        disabled={disabled || adding || !lookupTerm.trim()}
      >
        <Translate>Add</Translate>
      </Button>
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

export type { PeopleLookupSectionProps };
export { PeopleLookupSection };
