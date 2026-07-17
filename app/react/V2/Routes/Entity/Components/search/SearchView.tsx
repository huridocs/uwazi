import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { useForm, Controller } from 'react-hook-form';
import { useAtomValue } from 'jotai';
import { MagnifyingGlassIcon } from '@heroicons/react/24/solid';
import { t, Translate } from '#app/I18N/index.js';
import { snippets } from '#V2/api/search/index.js';
import { SnippetsSearchResponse } from '#V2/api/types.js';
import { templatesAtom } from '#V2/atoms/index.js';
import {
  useDocumentPdf,
  useEntityLanguage,
  useEntityScopedEntity,
} from '#V2/Routes/Entity/Components/context/index.js';
import { entityLoaderCache } from '../../EntityLoaderCache.js';
import { SEARCH_PARAM } from '../../urlParams.js';
import { NoSearch, NoResults } from './BlankState.js';
import { SearchSnippetList } from './SearchSnippetList.js';
import { isSnippetsResponse, scopeResultsToDocument } from './searchUtils.js';

type FormValues = {
  search: string;
};

const SearchView = () => {
  const entity = useEntityScopedEntity();
  const { language, mainDocument } = useEntityLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const initial = searchParams.get(SEARCH_PARAM) || '';
  const searchTerm = initial.trim();
  const templates = useAtomValue(templatesAtom);
  const { pdfController: mainPdfController } = useDocumentPdf();
  const [searchResults, setSearchResults] = useState<SnippetsSearchResponse | undefined>();
  const [activeSnippet, setActiveSnippet] = useState<string | null>(null);
  const requestSeq = useRef(0);
  const documentFilename = mainDocument?.filename;
  const cacheKeyLanguage = `${language}:${mainDocument?._id ?? ''}`;

  const template = useMemo(
    () => templates.find(temp => temp._id === entity.template),
    [entity.template, templates]
  );

  const { control, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: { search: initial },
  });

  useEffect(() => {
    reset({ search: initial });
  }, [initial, reset]);

  useEffect(() => {
    setActiveSnippet(null);
    mainPdfController?.deactivateSnippet();
  }, [mainDocument?._id, mainPdfController]);

  useEffect(() => {
    if (!searchTerm || !entity.sharedId) {
      setSearchResults(undefined);
      return undefined;
    }

    const seq = requestSeq.current + 1;
    requestSeq.current = seq;
    setSearchResults(undefined);

    const load = async () => {
      const cached = entityLoaderCache.getSearchResults(
        entity.sharedId,
        cacheKeyLanguage,
        searchTerm
      );
      if (cached) {
        if (seq === requestSeq.current) {
          setSearchResults(scopeResultsToDocument(cached, documentFilename));
        }
        return;
      }

      const results = await snippets(
        { sharedId: entity.sharedId, searchString: searchTerm, limit: 0 },
        { 'Content-Language': language }
      );

      if (seq !== requestSeq.current) return;

      if (!isSnippetsResponse(results)) {
        setSearchResults({ data: [] });
        return;
      }

      entityLoaderCache.setSearchResults(entity.sharedId, cacheKeyLanguage, searchTerm, results);
      setSearchResults(scopeResultsToDocument(results, documentFilename));
    };

    load().catch(() => {
      if (seq === requestSeq.current) setSearchResults({ data: [] });
    });

    return undefined;
  }, [
    searchTerm,
    language,
    cacheKeyLanguage,
    entity.sharedId,
    mainDocument?._id,
    documentFilename,
  ]);

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
      return;
    }
    mainPdfController?.deactivateSnippet();
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
        {!searchResults && searchTerm ? (
          <p className="text-sm text-ink-muted">
            <Translate>Loading</Translate>
          </p>
        ) : null}
        {!searchResults && !searchTerm ? <NoSearch /> : null}
        {searchResults?.data && searchResults.data.length < 1 ? <NoResults /> : null}
        {searchResults && searchResults.data.length > 0 ? (
          <SearchSnippetList
            results={searchResults}
            entityTemplateId={entity.template || ''}
            template={template}
            activeSnippet={activeSnippet}
            onActivate={activateSnippet}
          />
        ) : null}
      </div>
    </div>
  );
};

export { SearchView };
