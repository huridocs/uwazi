import React from 'react';
import { LightBulbIcon } from '@heroicons/react/24/outline';
import { Translate, t } from '#app/I18N/index.js';

// Entity Searchtab tips UI — Library keeps App/SearchTipsContent (intentional split).

type Tip = {
  example: () => string;
  prose: React.ReactElement;
  wide?: boolean;
};

const TIPS: Tip[] = [
  {
    example: () => t('System', 'juris*', 'juris*', false),
    prose: <Translate>matches jurisdiction, jurists, jurisprudence</Translate>,
  },
  {
    example: () => t('System', '198?', '198?', false),
    prose: <Translate>any single character</Translate>,
  },
  {
    example: () => t('System', '"Costa Rica"', '"Costa Rica"', false),
    prose: <Translate>the words together, in that order</Translate>,
  },
  {
    example: () => t('System', '"the status"~5', '"the status"~5', false),
    prose: <Translate>the words within 5 of each other</Translate>,
  },
  {
    example: () =>
      t('System', 'status AND women NOT Nicaragua', 'status AND women NOT Nicaragua', false),
    prose: <Translate>combine or exclude terms</Translate>,
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
      {TIPS.map(tip => {
        const example = tip.example();
        return (
          <li key={example}>
            <button
              type="button"
              onClick={() => onInsert(example)}
              aria-label={`${t('System', 'Search', null, false)}: ${example}`}
              className={`${ROW_CLASS} ${
                tip.wide
                  ? 'flex items-baseline gap-x-3'
                  : 'grid grid-cols-[7rem_1fr] items-baseline gap-x-3'
              }`}
            >
              <span dir="ltr" className={EXAMPLE_CLASS}>
                {example}
              </span>
              <span className={PROSE_CLASS}>{tip.prose}</span>
            </button>
          </li>
        );
      })}
    </ul>
  </>
);

export { SearchTipsContent };
