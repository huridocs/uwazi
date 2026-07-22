import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { useForm, Controller } from 'react-hook-form';
import { useAtomValue } from 'jotai';
import { MagnifyingGlassIcon } from '@heroicons/react/24/solid';
import { t, Translate } from '#app/I18N/index.js';
import { templatesAtom } from '#V2/atoms/index.js';
import {
  useDocumentPdf,
  useEntityLanguage,
  useEntityScopedEntity,
} from '#V2/Routes/Entity/Components/context/index.js';
import { SEARCH_PARAM } from '../../urlParams.js';
import { SearchResultsPanel } from './SearchResultsPanel.js';
import { useEntitySearchSnippets } from './useEntitySearchSnippets.js';

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
  const [activeSnippet, setActiveSnippet] = useState<string | null>(null);
  const { searchResults, searchError } = useEntitySearchSnippets({
    searchTerm,
    sharedId: entity.sharedId,
    language,
    mainDocumentId: mainDocument?._id,
    documentFilename: mainDocument?.filename,
  });

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
        <SearchResultsPanel
          searchError={searchError}
          searchResults={searchResults}
          searchTerm={searchTerm}
          entityTemplateId={entity.template || ''}
          template={template}
          activeSnippet={activeSnippet}
          onActivate={activateSnippet}
        />
      </div>
    </div>
  );
};

export { SearchView };
