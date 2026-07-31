import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAtomValue } from 'jotai';
import { t } from '#app/I18N/index.js';
import { QuerySearchBar } from '#V2/Components/UI/QuerySearchBar.js';
import { templatesAtom } from '#V2/atoms/index.js';
import {
  useDocumentPdf,
  useEntityLanguage,
  useEntityScopedEntity,
} from '#V2/Routes/Entity/Components/context/index.js';
import { useEntityHashParams, useUpdateEntityUrl } from '../../entityUrlState.js';
import { SEARCH_PARAM } from '../../urlParams.js';
import { SearchResultsPanel } from './SearchResultsPanel.js';
import { SearchTipsContent } from './SearchTipsContent.js';
import { useEntitySearchSnippets } from './useEntitySearchSnippets.js';

const URL_SYNC_MS = 250;

const SearchView = () => {
  const entity = useEntityScopedEntity();
  const { language, mainDocument } = useEntityLanguage();
  const hashParams = useEntityHashParams();
  const updateEntityUrl = useUpdateEntityUrl();
  const urlTerm = hashParams.get(SEARCH_PARAM) || '';
  const searchTerm = urlTerm.trim();
  const templates = useAtomValue(templatesAtom);
  const { pdfController: mainPdfController } = useDocumentPdf();
  const [activeSnippet, setActiveSnippet] = useState<string | null>(null);
  const [draft, setDraft] = useState(urlTerm);
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

  const writeSearchTerm = useCallback(
    (value: string) => {
      const trimmed = value.trim();
      updateEntityUrl({
        hash: next => {
          if (trimmed) {
            next.set(SEARCH_PARAM, trimmed);
          } else {
            next.delete(SEARCH_PARAM);
          }
        },
      });
    },
    [updateEntityUrl]
  );

  useEffect(() => {
    setDraft(urlTerm);
  }, [urlTerm]);

  useEffect(() => {
    if (draft.trim() === searchTerm) return undefined;
    const timer = setTimeout(() => writeSearchTerm(draft), URL_SYNC_MS);
    return () => clearTimeout(timer);
  }, [draft, searchTerm, writeSearchTerm]);

  useEffect(() => {
    setActiveSnippet(null);
    mainPdfController?.deactivateSnippet();
  }, [mainDocument?._id, mainPdfController]);

  const onChange = (value: string) => {
    setDraft(value);
    if (!value.trim()) {
      writeSearchTerm('');
    }
  };

  const onClear = () => {
    setDraft('');
    writeSearchTerm('');
  };

  const onInsertTip = (example: string) => {
    setDraft(example);
    writeSearchTerm(example);
  };

  const flushOnEnter = (event: React.KeyboardEvent) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    writeSearchTerm(draft);
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
    <div className="flex h-full min-h-0 flex-col">
      <div
        className="shrink-0 border-b border-border py-2"
        onKeyDown={flushOnEnter}
        role="presentation"
      >
        <QuerySearchBar
          value={draft}
          onChange={onChange}
          placeholder={t('System', 'Search this document', null, false)}
          ariaLabel={t('System', 'Search this document', null, false)}
          clearAriaLabel={t('System', 'Clear search', null, false)}
          tipsAriaLabel={t('System', 'Search tips', null, false)}
          tipsContent={<SearchTipsContent onInsert={onInsertTip} />}
        />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-0 py-3">
        <SearchResultsPanel
          searchError={searchError}
          searchResults={searchResults}
          searchTerm={searchTerm}
          entityTemplateId={entity.template || ''}
          template={template}
          activeSnippet={activeSnippet}
          onActivate={activateSnippet}
          onClear={onClear}
        />
      </div>
    </div>
  );
};

export { SearchView };
