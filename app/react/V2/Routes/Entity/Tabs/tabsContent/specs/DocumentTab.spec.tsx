/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import type { TextSelection } from '@huridocs/react-text-selection-handler';
import type { Entity, FileType } from '#V2/api/entities/types.js';
import { DocumentTab } from '../DocumentTab.js';

const selection: TextSelection = {
  text: 'selected',
  selectionRectangles: [{ top: 40, left: 80, width: 60, height: 12, regionId: '1' }],
};

jest.mock('#V2/Routes/Entity/Components/document/index.js', () => ({
  PlainText: () => null,
  DocumentViewModeSelect: () => null,
  DocumentLanguageFallbackNotice: () => null,
  DocumentSelectionFloatingMenu: () => <div data-testid="document-selection-floating-menu" />,
}));

jest.mock('#V2/Components/PDFViewer/index.js', () => ({
  PDF: () => <div data-testid="pdf" />,
}));

jest.mock('#V2/Components/Relationships/index.js', () => ({
  RelationshipsDisplay: () => null,
}));

jest.mock('#V2/CustomHooks/useIsMobile.js', () => ({
  useIsMobile: () => false,
}));

jest.mock('#V2/Routes/Entity/Components/context/index.js', () => ({
  useEntityLanguage: () => ({ isRtl: false }),
  useEnsureAnchors: () => async () => undefined,
  useDirectedRelationships: () => [],
  useDocumentPdf: () => ({ armedPdfFill: undefined, requestPdfFillCommit: jest.fn() }),
}));

jest.mock('#V2/Routes/Entity/Tabs/hooks/useDocumentPdfView.js', () => ({
  useDocumentPdfView: jest.fn(),
}));

jest.mock('#V2/Routes/Entity/Tabs/hooks/useRailInset.js', () => ({
  useRailInset: () => ({ railInsetRight: 0, measureRailInset: jest.fn() }),
}));

const { useDocumentPdfView } = jest.requireMock(
  '#V2/Routes/Entity/Tabs/hooks/useDocumentPdfView.js'
);

const pdfView = (canWrite: boolean) => ({
  filename: 'a.pdf',
  isRaw: false,
  pageNumber: 1,
  activeRelationshipId: undefined,
  handleTextSelect: jest.fn(),
  handleTextDeselect: jest.fn(),
  handleCreateRelationship: jest.fn(),
  handleAddToToC: jest.fn(),
  selectedText: selection,
  pdfSelectionMenuOpen: true,
  canWrite,
  handlePageChange: jest.fn(),
  handleHighlightClick: jest.fn(),
  handleRailHover: jest.fn(),
  handleRailPointClick: jest.fn(),
  handleClusterClick: jest.fn(),
  handleClusterMoreClick: jest.fn(),
  onPdfReady: jest.fn(),
  propertySelectionHighlights: undefined,
});

const entity: Entity = {
  _id: 'e1',
  sharedId: 's1',
  title: 'Entity',
  template: 't1',
  language: 'en',
  metadata: {},
  creationDate: 0,
  user: 'user1',
};

const mainDocument: FileType = {
  _id: 'doc1',
  filename: 'a.pdf',
};

describe('DocumentTab PDF selection menu', () => {
  it('shows the selection menu when the entity is write-authorized', () => {
    useDocumentPdfView.mockReturnValue(pdfView(true));
    render(<DocumentTab entity={entity} mainDocument={mainDocument} />);
    expect(screen.getByTestId('document-selection-floating-menu')).toBeInTheDocument();
  });

  it('hides the selection menu without write authorization', () => {
    useDocumentPdfView.mockReturnValue(pdfView(false));
    render(<DocumentTab entity={entity} mainDocument={mainDocument} />);
    expect(screen.queryByTestId('document-selection-floating-menu')).not.toBeInTheDocument();
  });
});
