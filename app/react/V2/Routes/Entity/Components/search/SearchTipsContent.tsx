import React from 'react';
import { LightBulbIcon } from '@heroicons/react/24/outline';
import { Translate, t } from '#app/I18N/index.js';

// Entity Searchtab tips UI — Library keeps App/SearchTipsContent (intentional split).

const TIPS: { example: string; proseKey: string; prose: string; wide?: boolean }[] = [
  {
    example: 'juris*',
    proseKey: 'Search Tips: wildcard',
    prose: 'matches jurisdiction, jurists, jurisprudence',
  },
  {
    example: '198?',
    proseKey: 'Search Tips: one char wildcard',
    prose: 'any single character',
  },
  {
    example: '"Costa Rica"',
    proseKey: 'Search Tips: exact term',
    prose: 'the words together, in that order',
  },
  {
    example: '"the status"~5',
    proseKey: 'Search Tips: proximity',
    prose: 'the words within 5 of each other',
  },
  {
    example: 'status AND women NOT Nicaragua',
    proseKey: 'Search Tips: boolean',
    prose: 'combine or exclude terms',
    wide: true,
  },
];

const ROW_CLASS =
  'w-full cursor-pointer rounded-md px-2 py-2 text-left transition-colors hover:bg-parchment ' +
  'focus:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ink/20';
const EXAMPLE_CLASS = 'whitespace-nowrap font-mono text-micro leading-snug text-ink';
const PROSE_CLASS = 'min-w-0 text-micro leading-snug text-ink-secondary';

type SearchTipsContentProps = {
  onInsert: (example: string) => void;
};

const SearchTipsContent = ({ onInsert }: SearchTipsContentProps) => (
  <>
    <div className="mb-1 flex items-center gap-1.5 border-b border-border-soft px-2 pb-2 pt-1">
      <LightBulbIcon className="h-3 w-3 text-ink-tertiary" aria-hidden="true" />
      <span className="text-nano font-semibold uppercase tracking-wide text-ink-tertiary">
        <Translate>Narrow your search</Translate>
      </span>
    </div>
    <ul className="flex flex-col">
      {TIPS.map(tip => (
        <li key={tip.example}>
          <button
            type="button"
            onClick={() => onInsert(tip.example)}
            aria-label={`${t('System', 'Search', null, false)}: ${tip.example}`}
            className={`${ROW_CLASS} ${
              tip.wide
                ? 'flex items-baseline gap-x-3'
                : 'grid grid-cols-[7rem_1fr] items-baseline gap-x-3'
            }`}
          >
            <span dir="ltr" className={EXAMPLE_CLASS}>
              {tip.example}
            </span>
            <span className={PROSE_CLASS}>{t('System', tip.proseKey, tip.prose, false)}</span>
          </button>
        </li>
      ))}
    </ul>
  </>
);

export { SearchTipsContent };
