/* eslint-disable react/no-array-index-key */
import React from 'react';
import { t, Translate } from '#app/I18N/index.js';
import type { SnippetsSearchResponse } from '#V2/api/types.js';
import type { ClientTemplateSchema } from '#V2/shared/types.js';
import { getFieldName, parseSnippetToNodes } from './searchUtils.js';

type SearchSnippetListProps = {
  results: SnippetsSearchResponse;
  entityTemplateId: string;
  template?: ClientTemplateSchema;
  activeSnippet: string | null;
  onActivate: (snippetKey: string, pageText: { text: string; page: number }) => void;
};

const SearchSnippetList = ({
  results,
  entityTemplateId,
  template,
  activeSnippet,
  onActivate,
}: SearchSnippetListProps) => (
  <div className="flex flex-col gap-3 pt-1">
    {results.data.map((entry, i) => {
      const { metadata, fullText } = entry.snippets;
      if (!metadata?.length && !fullText?.length) return undefined;

      return (
        <div key={`entry-${i}`} className="flex flex-col gap-4">
          {metadata?.length ? (
            <>
              <dl className="grid gap-y-2">
                {metadata.map((m, j) => (
                  <div
                    key={`metadata-${i}-${j}`}
                    className="rounded-md border border-border/40 bg-paper p-3"
                  >
                    <dt className="text-sm font-bold text-ink">
                      <Translate context={entityTemplateId}>
                        {getFieldName(m.field, template)}
                      </Translate>
                    </dt>
                    {m.texts.map((text, k) => (
                      <dd key={`metadata-${i}-${j}-${k}`} className="text-sm font-medium text-ink">
                        {parseSnippetToNodes(text)}
                      </dd>
                    ))}
                  </div>
                ))}
              </dl>
              <hr className="w-full" />
            </>
          ) : null}

          {fullText?.length
            ? fullText.map((pageText, j) => {
                const snippetKey = `${i}-${j}`;
                const isActive = activeSnippet === snippetKey;
                const snippetClass = [
                  'rounded-md border p-3 cursor-pointer hover:bg-warm transition',
                  isActive ? 'border-border bg-selected' : 'border-border/40 bg-paper',
                ].join(' ');

                return (
                  <div
                    key={snippetKey}
                    role="button"
                    tabIndex={0}
                    aria-pressed={isActive}
                    onClick={() => onActivate(snippetKey, pageText)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onActivate(snippetKey, pageText);
                      }
                    }}
                    className={snippetClass}
                  >
                    <p className="mb-4 px-2">{parseSnippetToNodes(pageText.text)}</p>
                    <p className="float-right font-bold">
                      {t('System', 'Page', null, false)} {pageText.page}
                    </p>
                  </div>
                );
              })
            : null}
        </div>
      );
    })}
  </div>
);

export { SearchSnippetList };
