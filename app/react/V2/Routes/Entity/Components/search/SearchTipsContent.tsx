/* eslint-disable react/no-multi-comp */
import React from 'react';
import { Translate, t } from '#app/I18N/index.js';

const TIPS: { example: string; proseKey: string; proseFallback: string }[] = [
  { example: 'juris*', proseKey: 'Search Tips: wildcard', proseFallback: 'matches many characters' },
  {
    example: '198?',
    proseKey: 'Search Tips: one char wildcard',
    proseFallback: 'any single character',
  },
  {
    example: '"Costa Rica"',
    proseKey: 'Search Tips: exact term',
    proseFallback: 'the words together, in that order',
  },
  {
    example: '"the status"~5',
    proseKey: 'Search Tips: proximity',
    proseFallback: 'the words within 5 of each other',
  },
];

const BOOLEAN_TIP = {
  example: 'status AND women NOT Nicaragua',
  proseKey: 'Search Tips: boolean',
  proseFallback: 'combine or exclude terms',
};

type SearchTipsContentProps = {
  onInsert: (example: string) => void;
};

const TipRow = ({
  example,
  prose,
  onInsert,
}: {
  example: string;
  prose: string;
  onInsert: (example: string) => void;
}) => (
  <li>
    <button
      type="button"
      onClick={() => onInsert(example)}
      aria-label={`${t('System', 'Search', null, false)}: ${example}`}
      className="w-full rounded-md px-1.5 py-1.5 text-start transition-colors hover:bg-parchment focus:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ink/20"
    >
      <code dir="ltr" className="font-mono text-nano text-ink">
        {example}
      </code>
      <span className="mt-0.5 block text-nano leading-snug text-ink-secondary">{prose}</span>
    </button>
  </li>
);

const SearchTipsContent = ({ onInsert }: SearchTipsContentProps) => (
  <>
    <div className="mb-1.5 text-xs font-semibold text-ink">
      <Translate>Narrow your search</Translate>
    </div>
    <ul className="flex flex-col gap-0.5">
      {TIPS.map(tip => (
        <TipRow
          key={tip.example}
          example={tip.example}
          prose={t('System', tip.proseKey, null, false) || tip.proseFallback}
          onInsert={onInsert}
        />
      ))}
      <TipRow
        example={BOOLEAN_TIP.example}
        prose={t('System', BOOLEAN_TIP.proseKey, null, false) || BOOLEAN_TIP.proseFallback}
        onInsert={onInsert}
      />
    </ul>
  </>
);

export { SearchTipsContent };
