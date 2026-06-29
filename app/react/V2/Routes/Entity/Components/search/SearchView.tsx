/* eslint-disable react/no-array-index-key */
import React, { useMemo, useState } from 'react';
import { useLoaderData, useSearchParams } from 'react-router';
import { useForm, Controller } from 'react-hook-form';
import { useAtomValue } from 'jotai';
import { MagnifyingGlassIcon } from '@heroicons/react/24/solid';
import { t, Translate } from '#app/I18N/index.js';
import { templatesAtom } from '#V2/atoms/index.js';
import { SEARCH_PARAM } from '../../urlParams.js';
import { LoaderResponse } from '../../types.js';
import { NoSearch, NoResults } from './BlankState.js';
import { getFieldName, parseSnippetToNodes } from './searchUtils.js';
import { useDocumentPdf } from '#V2/Routes/Entity/Components/context/index.js';

type FormValues = {
  search: string;
};

const SearchView = () => {
  const { searchResults, entity } = useLoaderData<LoaderResponse>() || {};
  const [searchParams, setSearchParams] = useSearchParams();
  const initial = new URLSearchParams(searchParams).get(SEARCH_PARAM) || '';
  const templates = useAtomValue(templatesAtom);
  const { pdfController: mainPdfController } = useDocumentPdf();

  const template = useMemo(
    () => templates.find(temp => temp._id === entity?.template),
    [entity, templates]
  );

  const { control, handleSubmit } = useForm<FormValues>({
    defaultValues: { search: initial },
  });

  const [activeSnippet, setActiveSnippet] = useState<string | null>(null);

  const onSubmit = async (data: FormValues) => {
    const params = new URLSearchParams(searchParams);
    const value = data.search.trim();
    if (value) {
      params.set(SEARCH_PARAM, value);
    } else {
      params.delete(SEARCH_PARAM);
    }
    setSearchParams(params);
  };

  const activateSnippet = (snippetKey: string, pageText: { text: string; page: number }) => {
    const newActive = activeSnippet === snippetKey ? null : snippetKey;
    setActiveSnippet(newActive);
    if (newActive) {
      mainPdfController?.activateSnippet({
        text: pageText.text,
        page: pageText.page,
      });
    }
  };

  return (
    <div className="flex h-full flex-col gap-3">
      <form onSubmit={handleSubmit(onSubmit)}>
        <label htmlFor="entity-search" className="sr-only">
          <Translate>Search</Translate>
        </label>
        <div className="relative">
          <Controller
            name="search"
            control={control}
            render={({ field }) => (
              <input
                id="entity-search"
                type="search"
                placeholder={t('System', 'Search', null, false)}
                // eslint-disable-next-line react/jsx-props-no-spreading
                {...field}
                className="w-full rounded-md border border-border/40 bg-warm p-2 text-sm text-ink placeholder:text-ink-muted focus:border-border focus:outline-hidden"
              />
            )}
          />
          <button
            type="submit"
            aria-label="Search"
            className="absolute top-1/2 right-3 -translate-y-1/2 transform"
          >
            <MagnifyingGlassIcon className="h-5 w-5 text-ink" aria-hidden="true" />
          </button>
        </div>
      </form>
      <div className="grow overflow-y-auto px-1">
        {!searchResults && <NoSearch />}
        {searchResults?.data && searchResults.data.length < 1 ? (
          <NoResults />
        ) : (
          <div className="flex flex-col gap-3 pt-1">
            {searchResults?.data.map((entry, i) => {
              const { metadata, fullText } = entry.snippets;

              if (!metadata?.length && !fullText?.length) {
                return undefined;
              }

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
                              <Translate context={entity?.template || ''}>
                                {getFieldName(m.field, template)}
                              </Translate>
                            </dt>
                            {m.texts.map((text, k) => (
                              <dd
                                key={`metadata-${i}-${j}-${k}`}
                                className="text-sm font-medium text-ink"
                              >
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
                            onClick={() => activateSnippet(snippetKey, pageText)}
                            onKeyDown={e => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                activateSnippet(snippetKey, pageText);
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
        )}
      </div>
    </div>
  );
};

export { SearchView };
