/**
 * @jest-environment jsdom
 */
import { act, renderHook } from '@testing-library/react';
import type { PDFControls } from '#V2/Components/PDFViewer/index.js';
import type { FileType } from '#V2/api/entities/types.js';
import { useDocumentPdfPage } from '../useDocumentPdfPage.js';

const mockUpdateEntityUrl = jest.fn();
let mockHashParams = new URLSearchParams();

jest.mock('../../../entityUrlState.js', () => ({
  useEntityHashParams: () => mockHashParams,
  useUpdateEntityUrl: () => mockUpdateEntityUrl,
}));

const mainDocument: FileType = {
  _id: 'doc1',
  filename: 'a.pdf',
  totalPages: 3,
};

const makeControls = (): PDFControls => ({
  goToPage: jest.fn(),
  scrollToHighlight: jest.fn(),
  activateSnippet: jest.fn(),
  deactivateSnippet: jest.fn(),
  toggleHighlights: jest.fn(),
});

describe('useDocumentPdfPage', () => {
  beforeEach(() => {
    mockHashParams = new URLSearchParams();
    mockUpdateEntityUrl.mockReset();
  });

  it('does not clear pdf controller on unmount when another owner holds it', () => {
    const setPdfController = jest.fn();
    const owned = makeControls();
    const other = makeControls();

    const { result, unmount, rerender } = renderHook(
      ({ controller }: { controller: PDFControls | null }) =>
        useDocumentPdfPage({
          mainDocument,
          mainPdfController: controller,
          setPdfController,
        }),
      { initialProps: { controller: null } }
    );

    act(() => {
      result.current.onPdfReady(owned);
    });
    expect(setPdfController).toHaveBeenCalledWith(owned);

    rerender({ controller: other });
    setPdfController.mockClear();
    unmount();

    expect(setPdfController).not.toHaveBeenCalled();
  });

  it('clears pdf controller on unmount when this instance set the current controller', () => {
    const setPdfController = jest.fn();
    const owned = makeControls();

    const { result, unmount, rerender } = renderHook(
      ({ controller }: { controller: PDFControls | null }) =>
        useDocumentPdfPage({
          mainDocument,
          mainPdfController: controller,
          setPdfController,
        }),
      { initialProps: { controller: null } }
    );

    act(() => {
      result.current.onPdfReady(owned);
    });
    rerender({ controller: owned });
    setPdfController.mockClear();
    unmount();

    expect(setPdfController).toHaveBeenCalledWith(null);
  });
});
