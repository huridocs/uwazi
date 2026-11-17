/**
 * @jest-environment jsdom
 */
import { renderHook } from '@testing-library/react';
import { createStore, Provider } from 'jotai';
import React, { type ReactNode } from 'react';
import { SIDE_TAB } from '#V2/Routes/Entity/Tabs/tabIds.js';
import { useDocumentPdfTextHandlers } from '../useDocumentPdfTextHandlers.js';

const mockFocusSideTab = jest.fn();
const mockAddEntry = jest.fn();
const mockSetEditMode = jest.fn();

jest.mock('#V2/Routes/Entity/Tabs/EntityTabsContext.js', () => ({
  useEntityTabNavigation: () => ({
    focusSideTab: mockFocusSideTab,
    focusRelationshipsPanel: jest.fn(),
  }),
}));

jest.mock('#V2/Routes/Entity/Components/context/index.js', () => ({
  useDocumentPdf: () => ({
    documentPdfSelection: undefined,
    pdfSelectionMenuOpen: false,
    setDocumentPdfSelection: jest.fn(),
    setPdfSelectionMenuOpen: jest.fn(),
  }),
  useMetadataEditing: () => ({ isEditing: false }),
  useRelationshipsActions: () => ({ openCreateRelationship: jest.fn() }),
  useTocActions: () => ({ addEntry: mockAddEntry, setEditMode: mockSetEditMode }),
  useEntityWriteAuthorized: () => true,
}));

describe('useDocumentPdfTextHandlers', () => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={createStore()}>{children}</Provider>
  );

  beforeEach(() => {
    mockFocusSideTab.mockClear();
    mockAddEntry.mockClear();
    mockSetEditMode.mockClear();
  });

  it('opens the table of contents in edit mode when text is added', () => {
    const { result } = renderHook(() => useDocumentPdfTextHandlers(), { wrapper });

    result.current.handleAddToToC({
      text: 'Chapter',
      selectionRectangles: [{ top: 0, left: 0, width: 1, height: 1, regionId: '2' }],
    });

    expect(mockAddEntry).toHaveBeenCalledWith(
      expect.objectContaining({ label: 'Chapter', indentation: 0 })
    );
    expect(mockSetEditMode).toHaveBeenCalledWith(true);
    expect(mockFocusSideTab).toHaveBeenCalledWith(SIDE_TAB.TOC);
  });
});
