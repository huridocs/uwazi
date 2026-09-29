/**
 * @jest-environment jsdom
 */
import React from 'react';
import { renderHook } from '@testing-library/react';
import { settingsAtom } from '#V2/atoms/index.js';
import { TestAtomStoreProvider } from '#V2/testing/index.js';
import { useDocumentPdfTextHandlers } from '../useDocumentPdfTextHandlers.js';

jest.mock('#V2/Routes/Entity/Components/context/index.js', () => ({
  useDocumentPdf: () => ({
    documentPdfSelection: undefined,
    pdfSelectionMenuOpen: false,
    setDocumentPdfSelection: jest.fn(),
    setPdfSelectionMenuOpen: jest.fn(),
  }),
  useMetadataEditing: () => ({ isEditing: false }),
  useRelationshipsActions: () => ({ openCreateRelationship: jest.fn() }),
  useTocActions: () => ({ addEntry: jest.fn() }),
  useEntityWriteAuthorized: jest.fn(),
}));

jest.mock('#V2/Routes/Entity/Tabs/EntityTabsContext.js', () => ({
  useEntityTabNavigation: () => ({
    focusRelationshipsPanel: jest.fn(),
    focusSideTab: jest.fn(),
  }),
}));

const { useEntityWriteAuthorized } = jest.requireMock(
  '#V2/Routes/Entity/Components/context/index.js'
);

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <TestAtomStoreProvider initialValues={[[settingsAtom, { features: {} }]]}>
    {children}
  </TestAtomStoreProvider>
);

describe('useDocumentPdfTextHandlers', () => {
  beforeEach(() => {
    useEntityWriteAuthorized.mockReset();
  });

  it('exposes entity write authorization for PDF selection actions', () => {
    useEntityWriteAuthorized.mockReturnValue(true);
    const { result } = renderHook(() => useDocumentPdfTextHandlers(), { wrapper });
    expect(result.current.canWrite).toBe(true);
  });

  it('does not authorize PDF selection actions without write', () => {
    useEntityWriteAuthorized.mockReturnValue(false);
    const { result } = renderHook(() => useDocumentPdfTextHandlers(), { wrapper });
    expect(result.current.canWrite).toBe(false);
  });
});
