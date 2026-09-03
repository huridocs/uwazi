import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAtomValue } from 'jotai';
import { t } from '#app/I18N/index.js';
import { QuerySearchBar } from '#V2/Components/UI/QuerySearchBar.js';
import { templatesAtom } from '#V2/atoms/index.js';
import {
  useDocumentPdf,
  useEntityLanguage,
  useEntityScopedEntity,
} from '#V2/Routes/Entity/Components/context/index.js';
import { MAIN_TAB } from '../../Tabs/tabIds.js';
import {
  useEntityHashUiParams,
  useEntityRawView,
  useUpdateEntityUrl,
} from '../../entityUrlState.js';
import { PAGE_PARAM, SEARCH_PARAM } from '../../urlParams.js';
import { scrollToPlaintextPage } from '../document/scrollToPlaintextPage.js';
import { SearchResultsPanel } from './SearchResultsPanel.js';
import { useEntitySearchSnippets } from './useEntitySearchSnippets.js';
import { useJumpToSearchHit } from './useJumpToSearchHit.js';

const URL_SYNC_MS = 250;

type PendingSnippet = { text: string; page: number };

// eslint-disable-next-line max-statements
const SearchView = () => {
  const entity = useEntityScopedEntity();
  const { language, mainDocument } = useEntityLanguage();
  const hashParams = useEntityHashUiParams();
  const updateEntityUrl = useUpdateEntityUrl();
  const urlTerm = hashParams.get(SEARCH_PARAM) || '';
  const searchTerm = urlTerm.trim();
  const isRaw = useEntityRawView();
  const templates = useAtomValue(templatesAtom);
  const { pdfController: mainPdfController } = useDocumentPdf();
  const mainPdfControllerRef = useRef(mainPdfController);
  mainPdfControllerRef.current = mainPdfController;
  const { ensureMainTab } = useJumpToSearchHit();
  const [activeSnippet, setActiveSnippet] = useState<string | null>(null);
  const [pendingSnippet, setPendingSnippet] = useState<PendingSnippet | null>(null);
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

  const clearSnippetSelection = useCallback(() => {
    setActiveSnippet(null);
    setPendingSnippet(null);
    mainPdfControllerRef.current?.deactivateSnippet();
  }, []);

  useEffect(() => {
    setDraft(urlTerm);
  }, [urlTerm]);

  useEffect(() => {
    if (draft.trim() === searchTerm) return undefined;
    const timer = setTimeout(() => writeSearchTerm(draft), URL_SYNC_MS);
    return () => clearTimeout(timer);
  }, [draft, searchTerm, writeSearchTerm]);

  useEffect(() => {
    // Reset selection only when the document changes, not when PDF remounts.
    clearSnippetSelection();
  }, [mainDocument?._id, clearSnippetSelection]);

  useEffect(() => {
    clearSnippetSelection();
  }, [searchTerm, clearSnippetSelection]);

  useEffect(() => {
    if (isRaw || !pendingSnippet || !mainPdfController) return;
    // Keep pending across Document remounts: re-activate when controller is replaced.
    mainPdfController.activateSnippet(pendingSnippet);
  }, [isRaw, pendingSnippet, mainPdfController]);

  const onChange = (value: string) => {
    setDraft(value);
    if (!value.trim()) {
      clearSnippetSelection();
      writeSearchTerm('');
    }
  };

  const onClear = () => {
    setDraft('');
    clearSnippetSelection();
    writeSearchTerm('');
  };

  const flushOnEnter = (event: React.KeyboardEvent) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    writeSearchTerm(draft);
  };

  const activateSnippet = (snippetKey: string, pageText: PendingSnippet) => {
    const newActive = activeSnippet === snippetKey ? null : snippetKey;
    setActiveSnippet(newActive);
    if (newActive) {
      ensureMainTab(MAIN_TAB.DOCUMENT, {
        hash: next => {
          next.set(PAGE_PARAM, String(pageText.page));
        },
      });
      if (isRaw) {
        setPendingSnippet(null);
        scrollToPlaintextPage(pageText.page);
        return;
      }
      // Always queue; Document remount clears a stale controller after an immediate activate.
      setPendingSnippet(pageText);
      mainPdfControllerRef.current?.goToPage(pageText.page);
      return;
    }
    setPendingSnippet(null);
    mainPdfControllerRef.current?.deactivateSnippet();
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        className="shrink-0 border-b border-border px-3 py-2"
        onKeyDown={flushOnEnter}
        role="presentation"
      >
        <QuerySearchBar
          value={draft}
          onChange={onChange}
          placeholder={t('System', 'Search this document', null, false)}
          ariaLabel={t('System', 'Search this document', null, false)}
          clearAriaLabel={t('System', 'Clear search', null, false)}
          className="p-0"
        />
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-3 py-3">
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
