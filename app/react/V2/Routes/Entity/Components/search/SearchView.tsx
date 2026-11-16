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
import {
  useEntityHashUiParams,
  useEntityRawView,
  useUpdateEntityUrl,
} from '../../entityUrlState.js';
import { SEARCH_PARAM } from '../../urlParams.js';
import { SearchResultsPanel } from './SearchResultsPanel.js';
import { useEntitySearchSnippets } from './useEntitySearchSnippets.js';
import { useJumpToSearchHit } from './useJumpToSearchHit.js';
import { useDocumentHighlightPaint } from '../document/documentHighlightGate.js';
import { activateSearchSnippet, type PendingSnippet } from './searchSnippetActivate.js';

const URL_SYNC_MS = 250;

const writeSearchHash = (updateEntityUrl: ReturnType<typeof useUpdateEntityUrl>, value: string) => {
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
};

const useSearchViewEffects = ({
  urlTerm,
  searchTerm,
  draft,
  writeSearchTerm,
  mainDocumentId,
  clearSnippetSelection,
  isRaw,
  pendingSnippet,
  mainPdfController,
  setDraft,
  paintHighlight,
  paintedRef,
}: {
  urlTerm: string;
  searchTerm: string;
  draft: string;
  writeSearchTerm: (value: string) => void;
  mainDocumentId: string | undefined;
  clearSnippetSelection: () => void;
  isRaw: boolean;
  pendingSnippet: PendingSnippet | null;
  mainPdfController: ReturnType<typeof useDocumentPdf>['pdfController'];
  setDraft: (value: string) => void;
  paintHighlight: (run: () => void) => void;
  paintedRef: React.MutableRefObject<{
    snippet: PendingSnippet | null;
    controller: ReturnType<typeof useDocumentPdf>['pdfController'];
  }>;
}) => {
  useEffect(() => {
    setDraft(urlTerm);
  }, [setDraft, urlTerm]);
  useEffect(() => {
    if (draft.trim() === searchTerm) return undefined;
    const timer = setTimeout(() => writeSearchTerm(draft), URL_SYNC_MS);
    return () => clearTimeout(timer);
  }, [draft, searchTerm, writeSearchTerm]);
  useEffect(() => {
    clearSnippetSelection();
  }, [mainDocumentId, searchTerm, clearSnippetSelection]);
  useEffect(() => {
    if (isRaw || !pendingSnippet || !mainPdfController) return;
    if (
      paintedRef.current.snippet === pendingSnippet &&
      paintedRef.current.controller === mainPdfController
    ) {
      return;
    }
    paintedRef.current = { snippet: pendingSnippet, controller: mainPdfController };
    paintHighlight(() => {
      mainPdfController.activateSnippet(pendingSnippet);
    });
  }, [isRaw, mainPdfController, paintHighlight, paintedRef, pendingSnippet]);
};

const useSearchViewQuery = () => {
  const entity = useEntityScopedEntity();
  const { language, mainDocument } = useEntityLanguage();
  const hashParams = useEntityHashUiParams();
  const urlTerm = hashParams.get(SEARCH_PARAM) || '';
  const searchTerm = urlTerm.trim();
  const templates = useAtomValue(templatesAtom);
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
  return {
    entity,
    mainDocument,
    urlTerm,
    searchTerm,
    searchResults,
    searchError,
    template,
  };
};

const useSearchSnippetControls = (args: {
  urlTerm: string;
  updateEntityUrl: ReturnType<typeof useUpdateEntityUrl>;
  mainPdfControllerRef: React.MutableRefObject<ReturnType<typeof useDocumentPdf>['pdfController']>;
  isRaw: boolean;
  ensureMainTab: ReturnType<typeof useJumpToSearchHit>['ensureMainTab'];
}) => {
  const { urlTerm, updateEntityUrl, mainPdfControllerRef, isRaw, ensureMainTab } = args;
  const [activeSnippet, setActiveSnippet] = useState<string | null>(null);
  const [pendingSnippet, setPendingSnippet] = useState<PendingSnippet | null>(null);
  const [draft, setDraft] = useState(urlTerm);
  const paintHighlight = useDocumentHighlightPaint();
  const paintedRef = useRef<{
    snippet: PendingSnippet | null;
    controller: ReturnType<typeof useDocumentPdf>['pdfController'];
  }>({ snippet: null, controller: null });
  const writeSearchTerm = useCallback(
    (value: string) => writeSearchHash(updateEntityUrl, value),
    [updateEntityUrl]
  );
  const clearSnippetSelection = useCallback(() => {
    setActiveSnippet(null);
    setPendingSnippet(null);
    mainPdfControllerRef.current?.deactivateSnippet();
  }, [mainPdfControllerRef]);
  const activateSnippet = useCallback(
    (snippetKey: string, pageText: PendingSnippet) => {
      const controller = mainPdfControllerRef.current;
      if (!isRaw && controller) {
        paintedRef.current = { snippet: pageText, controller };
      }
      activateSearchSnippet({
        snippetKey,
        pageText,
        activeSnippet,
        isRaw,
        ensureMainTab,
        setActiveSnippet,
        setPendingSnippet,
        pdfController: controller,
        paintHighlight,
      });
    },
    [activeSnippet, ensureMainTab, isRaw, mainPdfControllerRef, paintHighlight]
  );
  return {
    activeSnippet,
    pendingSnippet,
    draft,
    setDraft,
    writeSearchTerm,
    clearSnippetSelection,
    activateSnippet,
    paintHighlight,
    paintedRef,
  };
};

const useSearchViewControls = ({
  urlTerm,
  searchTerm,
  isRaw,
  mainDocumentId,
  mainPdfController,
}: {
  urlTerm: string;
  searchTerm: string;
  isRaw: boolean;
  mainDocumentId: string | undefined;
  mainPdfController: ReturnType<typeof useDocumentPdf>['pdfController'];
}) => {
  const updateEntityUrl = useUpdateEntityUrl();
  const mainPdfControllerRef = useRef(mainPdfController);
  mainPdfControllerRef.current = mainPdfController;
  const { ensureMainTab } = useJumpToSearchHit();
  const snippets = useSearchSnippetControls({
    urlTerm,
    updateEntityUrl,
    mainPdfControllerRef,
    isRaw,
    ensureMainTab,
  });
  useSearchViewEffects({
    urlTerm,
    searchTerm,
    draft: snippets.draft,
    writeSearchTerm: snippets.writeSearchTerm,
    mainDocumentId,
    clearSnippetSelection: snippets.clearSnippetSelection,
    isRaw,
    pendingSnippet: snippets.pendingSnippet,
    mainPdfController,
    setDraft: snippets.setDraft,
    paintHighlight: snippets.paintHighlight,
    paintedRef: snippets.paintedRef,
  });
  return {
    draft: snippets.draft,
    activeSnippet: snippets.activeSnippet,
    setDraft: snippets.setDraft,
    writeSearchTerm: snippets.writeSearchTerm,
    clearSnippetSelection: snippets.clearSnippetSelection,
    activateSnippet: snippets.activateSnippet,
  };
};

const SearchView = () => {
  const query = useSearchViewQuery();
  const isRaw = useEntityRawView();
  const { pdfController: mainPdfController } = useDocumentPdf();
  const controls = useSearchViewControls({
    urlTerm: query.urlTerm,
    searchTerm: query.searchTerm,
    isRaw,
    mainDocumentId: query.mainDocument?._id,
    mainPdfController,
  });
  const onChange = (value: string) => {
    controls.setDraft(value);
    if (!value.trim()) {
      controls.clearSnippetSelection();
      controls.writeSearchTerm('');
    }
  };
  const onClear = () => {
    controls.setDraft('');
    controls.clearSnippetSelection();
    controls.writeSearchTerm('');
  };
  const flushOnEnter = (event: React.KeyboardEvent) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    controls.writeSearchTerm(controls.draft);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        className="shrink-0 border-b border-border px-3 py-2"
        onKeyDown={flushOnEnter}
        role="presentation"
      >
        <QuerySearchBar
          value={controls.draft}
          onChange={onChange}
          placeholder={t('System', 'Search this document', null, false)}
          ariaLabel={t('System', 'Search this document', null, false)}
          clearAriaLabel={t('System', 'Clear search', null, false)}
          className="p-0"
        />
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-3 py-3">
        <SearchResultsPanel
          searchError={query.searchError}
          searchResults={query.searchResults}
          searchTerm={query.searchTerm}
          entityTemplateId={query.entity.template || ''}
          template={query.template}
          activeSnippet={controls.activeSnippet}
          onActivate={controls.activateSnippet}
          onClear={onClear}
        />
      </div>
    </div>
  );
};

export { SearchView };
