/**
 * @jest-environment jsdom
 */
import { act, renderHook } from '@testing-library/react';
import type { PDFControls } from '#V2/Components/PDFViewer/index.js';
import type { FileType } from '#V2/api/entities/types.js';
import { useDocumentPdfPage } from '../useDocumentPdfPage.js';

const mockUpdateEntityUrl = jest.fn();
let mockHashParams = new URLSearchParams();

jest.mock('#V2/Routes/Entity/entityUrlState.js', () => ({
  useEntityDocumentPage: () => Number.parseInt(mockHashParams.get('page') || '1', 10),
  useEntityRawView: () => mockHashParams.get('raw') === 'true',
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
      { initialProps: { controller: null as PDFControls | null } }
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
      { initialProps: { controller: null as PDFControls | null } }
    );

    act(() => {
      result.current.onPdfReady(owned);
    });
    rerender({ controller: owned });
    setPdfController.mockClear();
    unmount();

    expect(setPdfController).toHaveBeenCalledWith(null);
  });

  it('applies the latest visible page when sync unlocks after restoring a hash page', () => {
    jest.useFakeTimers();
    mockHashParams.set('page', '2');
    const setPdfController = jest.fn();
    const owned = makeControls();

    const { result } = renderHook(() =>
      useDocumentPdfPage({
        mainDocument,
        mainPdfController: null,
        setPdfController,
      })
    );

    act(() => {
      result.current.onPdfReady(owned);
    });
    expect(owned.goToPage).toHaveBeenCalledWith(2);

    act(() => {
      result.current.handlePageChange(9);
    });
    expect(mockUpdateEntityUrl).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(400);
    });

    expect(mockUpdateEntityUrl).toHaveBeenCalled();
    jest.useRealTimers();
  });
});
