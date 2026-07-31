/* eslint-disable react/no-array-index-key */
import React from 'react';
import { useSetAtom } from 'jotai';
import { Translate } from '#app/I18N/index.js';
import { useTabGroup } from '#V2/Components/UI/index.js';
import type { SnippetsSearchResponse } from '#V2/api/types.js';
import type { ClientTemplateSchema } from '#V2/shared/types.js';
import { useUpdateEntityUrl } from '../../entityUrlState.js';
import { SIDE_TAB_PARAM } from '../../urlParams.js';
import { SIDE_TAB } from '../../Tabs/tabIds.js';
import {
  esFieldToFocusKey,
  focusMetadataFieldAtom,
} from '../metadata/focusMetadataFieldAtom.js';
import { getFieldName, parseSnippetToNodes, totalMatchCount } from './searchUtils.js';
import { SearchPageSpine } from './SearchPageSpine.js';

type SearchSnippetListProps = {
  results: SnippetsSearchResponse;
  searchTerm: string;
  entityTemplateId: string;
  template?: ClientTemplateSchema;
  activeSnippet: string | null;
  onActivate: (snippetKey: string, pageText: { text: string; page: number }) => void;
};

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <span className="px-1 text-nano font-semibold uppercase tracking-wide text-ink-muted">
    {children}
  </span>
);

const SearchSnippetList = ({
  results,
  searchTerm,
  entityTemplateId,
  template,
  activeSnippet,
  onActivate,
}: SearchSnippetListProps) => {
  const setFocusField = useSetAtom(focusMetadataFieldAtom);
  const { selectTab: selectSideTab } = useTabGroup('entity-side');
  const updateEntityUrl = useUpdateEntityUrl();
  const matchCount = totalMatchCount(results);

  const focusProperty = (esField: string) => {
    setFocusField({ fieldKey: esFieldToFocusKey(esField) });
    selectSideTab(SIDE_TAB.METADATA);
    updateEntityUrl({
      hash: next => {
        next.set(SIDE_TAB_PARAM, SIDE_TAB.METADATA);
      },
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <span dir="ltr" className="px-1 text-micro text-ink-tertiary">
        {matchCount.toLocaleString()}{' '}
        {matchCount === 1 ? <Translate>match</Translate> : <Translate>matches</Translate>}{' '}
        <Translate>for</Translate>{' '}
        <span className="font-medium text-ink">“{searchTerm}”</span>
      </span>

      {results.data.map((entry, i) => {
        const { metadata, fullText } = entry.snippets;
        if (!metadata?.length && !fullText?.length) return null;

        return (
          <div key={`entry-${i}`} className="flex flex-col gap-3">
            {metadata?.length ? (
              <div className="flex flex-col gap-1.5">
                <SectionLabel>
                  <Translate>Properties</Translate>
                </SectionLabel>
                {metadata.map((m, j) => (
                  <button
                    key={`metadata-${i}-${j}`}
                    type="button"
                    onClick={() => focusProperty(m.field)}
                    className="w-full cursor-pointer rounded-md bg-warm/50 px-2 py-1.5 text-start transition-colors hover:bg-parchment focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ink/20"
                  >
                    <span className="block text-nano font-semibold uppercase tracking-wide text-ink-tertiary">
                      <Translate context={entityTemplateId}>
                        {getFieldName(m.field, template)}
                      </Translate>
                    </span>
                    {m.texts.map((text, k) => (
                      <span
                        key={`metadata-${i}-${j}-${k}`}
                        className="block text-sm leading-relaxed text-ink"
                      >
                        {parseSnippetToNodes(text)}
                      </span>
                    ))}
                  </button>
                ))}
              </div>
            ) : null}

            {fullText?.length ? (
              <div className="flex flex-col gap-1.5">
                <SectionLabel>
                  <Translate>Document</Translate>
                </SectionLabel>
                <SearchPageSpine
                  fullText={fullText}
                  activeSnippet={activeSnippet}
                  snippetKeyFor={j => `${i}-${j}`}
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
