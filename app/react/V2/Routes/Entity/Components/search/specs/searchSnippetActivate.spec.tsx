/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { createStore, Provider } from 'jotai';
import type { PDFControls } from '#V2/Components/PDFViewer/index.js';
import { focusMetadataFieldAtom } from '#V2/Components/Metadata/focusMetadataFieldAtom.js';
import { tabGroupsAtom } from '#V2/Components/UI/Tabs/tabsAtoms.js';
import { EntityTabsProvider } from '#V2/Routes/Entity/Tabs/EntityTabsContext.js';
import { MAIN_TAB, SIDE_TAB } from '#V2/Routes/Entity/Tabs/tabIds.js';
import { useLibraryPreviewTabs } from '#V2/Routes/Library/Components/useLibraryPreviewTabs.js';
import { activateSearchSnippet } from '../searchSnippetActivate.js';
import { SearchSnippetActions } from './searchSnippetActivateHost.js';

const pdf = (): PDFControls => ({
  goToPage: jest.fn(),
  scrollToHighlight: jest.fn(),
  activateSnippet: jest.fn(),
  deactivateSnippet: jest.fn(),
  toggleHighlights: jest.fn(),
});

const Tabs = ({ controller }: { controller: PDFControls }) => {
  const tabs = useLibraryPreviewTabs(SIDE_TAB.SEARCH);
  return (
    <EntityTabsProvider value={tabs}>
      <SearchSnippetActions controller={controller} />
    </EntityTabsProvider>
  );
};

const renderActions = () => {
  const store = createStore();
  const controller = pdf();
  render(
    <Provider store={store}>
      <Tabs controller={controller} />
    </Provider>
  );
  return { store, controller };
};

describe('searchSnippetActivate with library tabs', () => {
  it('selects metadata and focuses the property field', () => {
    const { store } = renderActions();
    fireEvent.click(screen.getByRole('button', { name: 'property' }));
    expect(store.get(tabGroupsAtom)['entity-main']?.activeTabId).toBe(MAIN_TAB.METADATA);
    expect(store.get(focusMetadataFieldAtom)).toEqual({ fieldKey: 'region' });
  });

  it('marks the snippet after the document can paint', () => {
    const controller = pdf();
    let queued: (() => void) | undefined;
    activateSearchSnippet({
      snippetKey: 'doc-1',
      pageText: { text: 'court', page: 4 },
      activeSnippet: null,
      isRaw: false,
      ensureMainTab: jest.fn(),
      setActiveSnippet: () => undefined,
      setPendingSnippet: () => undefined,
      pdfController: controller,
      paintHighlight: run => {
        queued = run;
      },
    });
    expect(controller.goToPage).toHaveBeenCalledWith(4);
    expect(controller.activateSnippet).not.toHaveBeenCalled();
    queued?.();
    expect(controller.activateSnippet).toHaveBeenCalledWith({ text: 'court', page: 4 });
  });

  it('selects the document and jumps the mounted controller to the snippet page', () => {
    const { store, controller } = renderActions();
    fireEvent.click(screen.getByRole('button', { name: 'document' }));
    expect(store.get(tabGroupsAtom)['entity-main']?.activeTabId).toBe(MAIN_TAB.DOCUMENT);
    expect(controller.goToPage).toHaveBeenCalledWith(4);
  });
});
