import React from 'react';
import { Translate } from '#app/I18N/index.js';
import type { SnippetsSearchResponse } from '#V2/api/types.js';
import type { ClientTemplateSchema } from '#V2/shared/types.js';
import {
  getFieldName,
  parseSnippetToNodes,
  sortFullTextByPage,
  sortMetadataByTemplate,
  totalMatchCount,
} from './searchUtils.js';
import { SearchPageSpine } from './SearchPageSpine.js';
import { useJumpToSearchHit } from './useJumpToSearchHit.js';

type SearchSnippetListProps = {
  results: SnippetsSearchResponse;
  searchTerm: string;
  entityTemplateId: string;
  template?: ClientTemplateSchema;
  activeSnippet: string | null;
  onActivate: (snippetKey: string, pageText: { text: string; page: number }) => void;
};

const sectionLabelClass = 'px-1 text-nano font-semibold uppercase tracking-wide text-ink-muted';

const SearchSnippetList = ({
  results,
  searchTerm,
  entityTemplateId,
  template,
  activeSnippet,
  onActivate,
}: SearchSnippetListProps) => {
  const { jumpToProperty } = useJumpToSearchHit();
  const matchCount = totalMatchCount(results);

  return (
    <div className="flex flex-col gap-3">
      <span dir="ltr" className="px-1 text-micro text-ink-tertiary">
        {matchCount.toLocaleString()}{' '}
        {matchCount === 1 ? <Translate>match</Translate> : <Translate>matches</Translate>}{' '}
        <Translate>for</Translate> <span className="font-medium text-ink">“{searchTerm}”</span>
      </span>

      {results.data.map(entry => {
        const metadata = sortMetadataByTemplate(entry.snippets.metadata, template);
        const fullText = sortFullTextByPage(entry.snippets.fullText);
        if (!metadata.length && !fullText.length) return null;

        return (
          <div key={entry._id} className="flex flex-col gap-3">
            {metadata.length ? (
              <div className="flex flex-col gap-1.5">
                <span className={sectionLabelClass}>
                  <Translate>Properties</Translate>
                </span>
                {metadata.map(m => (
                  <button
                    key={`${entry._id}-${m.field}`}
                    type="button"
                    onClick={() => jumpToProperty(m.field)}
                    className="w-full cursor-pointer rounded-md bg-warm/50 px-2 py-1.5 text-start transition-colors hover:bg-parchment focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ink/20"
                  >
                    <span className="block text-nano font-semibold uppercase tracking-wide text-ink-tertiary">
                      <Translate context={entityTemplateId}>
                        {getFieldName(m.field, template)}
                      </Translate>
                    </span>
                    {m.texts.map((text, textIndex) => (
                      <span
                        // eslint-disable-next-line react/no-array-index-key
                        key={`${m.field}-${textIndex}-${text}`}
                        className="block text-sm leading-relaxed text-ink"
                      >
                        {parseSnippetToNodes(text)}
                      </span>
                    ))}
                  </button>
                ))}
              </div>
            ) : null}

            {fullText.length ? (
              <div className="flex flex-col gap-1.5">
                <span className={sectionLabelClass}>
                  <Translate>Document</Translate>
                </span>
                <SearchPageSpine
                  fullText={fullText}
                  activeSnippet={activeSnippet}
                  snippetKeyFor={j => `${entry._id}-${j}`}
                  onActivate={onActivate}
                />
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
};

export { SearchSnippetList };
