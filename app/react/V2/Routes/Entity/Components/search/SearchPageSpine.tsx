import React from 'react';
import { t } from '#app/I18N/index.js';
import { parseSnippetToNodes } from './searchUtils.js';

type FullTextHit = {
  text: string;
  page: number;
};

type SearchPageSpineProps = {
  fullText: FullTextHit[];
  activeSnippet: string | null;
  snippetKeyFor: (index: number) => string;
  onActivate: (snippetKey: string, pageText: FullTextHit) => void;
};

const countMarks = (html: string): number => (html.match(/<b>/gi) || []).length;

const SearchPageSpine = ({
  fullText,
  activeSnippet,
  snippetKeyFor,
  onActivate,
}: SearchPageSpineProps) => {
  const pageLabel = t('System', 'Page', null, false);
  const matchLabel = t('System', 'match', null, false);
  const matchesLabel = t('System', 'matches', null, false);
  const pageAbbrev = t('System', 'p.', null, false);

  return (
    <div className="relative flex flex-col gap-1.5 ps-4">
      <span
        aria-hidden="true"
        className="absolute inset-y-1.5 w-px bg-border/60"
        style={{ insetInlineStart: '0.1875rem' }}
      />
      {fullText.map((pageText, index) => {
        const snippetKey = snippetKeyFor(index);
        const isActive = activeSnippet === snippetKey;
        const hits = Math.max(1, countMarks(pageText.text));
        return (
          <button
            key={snippetKey}
            type="button"
            aria-pressed={isActive}
            aria-label={`${pageLabel} ${pageText.page}, ${hits} ${
              hits === 1 ? matchLabel : matchesLabel
            }`}
            onClick={() => onActivate(snippetKey, pageText)}
            className={`w-full cursor-pointer rounded-md px-2 py-1.5 text-start
              transition-colors focus-visible:outline-none focus-visible:ring-1
              focus-visible:ring-inset focus-visible:ring-ink/20 ${
                isActive ? 'bg-parchment' : 'hover:bg-warm'
              }`}
          >
            <p className="text-sm leading-relaxed text-ink">{parseSnippetToNodes(pageText.text)}</p>
            <span
              dir="ltr"
              className="mt-0.5 block text-end text-xs font-semibold tabular-nums text-ink-tertiary"
            >
              {pageAbbrev}
              {pageText.page}
              {hits > 1 ? ` · ${hits}×` : ''}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export { SearchPageSpine };
export type { FullTextHit };
