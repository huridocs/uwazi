/**
 * @jest-environment jsdom
 */

import React from 'react';
import { PDFDocumentLoadingTask, PDFDocumentProxy } from 'pdfjs-dist';
import { act, render, screen, waitFor } from '@testing-library/react';
import { mockEventBus } from './fixtures.js';
import { PDF } from '../PDF.jsx';

const mockGetDocument = jest.fn();

jest.mock('../PDFPage', () => ({
  PDFPage: ({
    page,
    eventBus,
    containerWidth,
  }: {
    page: number;
    eventBus?: any;
    containerWidth?: number;
  }) => {
    eventBus?.dispatch('pageready', { pageNumber: page });
    eventBus?.dispatch('pagerendered', { pageNumber: page });
    return (
      <div
        data-testid={`pdf-page-${page}`}
        data-container-width={String(containerWidth)}
        data-pagenumber={String(page)}
      />
    );
  },
}));

jest.mock('../pdfjs.ts', () => ({
  PDFJS: {
    getDocument: (...args: any[]) => mockGetDocument(...args),
  },
  CMAP_URL: '/legacy_character_maps/',
  WASM_URL: '/pdfjs_wasm/',
  EventBus: mockEventBus,
  PixelsPerInch: { PDF_TO_CSS_UNITS: 1 },
}));

const observers: Array<IntersectionObserverCallback> = [];
const resizeObservers: Array<ResizeObserverMock> = [];

class ResizeObserverMock {
  callback: ResizeObserverCallback;

  constructor(cb: ResizeObserverCallback) {
    this.callback = cb;
    resizeObservers.push(this);
  }

  observe = jest.fn();

  unobserve = jest.fn();

  disconnect = jest.fn();
}

global.IntersectionObserver = jest.fn().mockImplementation((cb: IntersectionObserverCallback) => {
  observers.push(cb);
  return {
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  } as any;
});

global.ResizeObserver = ResizeObserverMock;

beforeEach(() => {
  mockGetDocument.mockReset();
});

function makeResolvedPdf(numPages = 4) {
  return {
    promise: Promise.resolve({
      numPages,
      getPage: jest
        .fn()
        .mockResolvedValue({ getViewport: () => ({ width: 100, height: 200, scale: 1 }) }),
    }),
    onProgress: jest.fn(),
    destroy: jest.fn(),
  };
}

describe('PDF', () => {
  it('should show a loading message', async () => {
    let resolveDoc: (value: PDFDocumentProxy) => void;

    const loadingTask: Partial<PDFDocumentLoadingTask> & { destroy: jest.Mock } = {
      promise: new Promise<PDFDocumentProxy>(res => {
        resolveDoc = res;
      }),
      onProgress: jest.fn() as PDFDocumentLoadingTask['onProgress'],
      destroy: jest.fn(),
    };

    mockGetDocument.mockReturnValueOnce(loadingTask);

    await act(async () => {
      await render(<PDF fileUrl="/file.pdf" />);
    });

    expect(mockGetDocument).toHaveBeenNthCalledWith(1, {
      url: '/file.pdf',
      cMapUrl: '/legacy_character_maps/',
      cMapPacked: true,
      wasmUrl: '/pdfjs_wasm/',
      isEvalSupported: false,
    });

    expect(screen.getByText(/Loading/)).toBeInTheDocument();

    await act(async () => {
      resolveDoc({
        numPages: 4,
        getPage: jest
          .fn()
          .mockResolvedValue({ getViewport: () => ({ width: 100, height: 200, scale: 1 }) }),
      } as unknown as PDFDocumentProxy);
      loadingTask.onProgress?.({ percent: 100 });
    });

    await waitFor(() => expect(screen.queryByText(/Loading/)).not.toBeInTheDocument());
  });

  it('should render with the expected classnames and styles', async () => {
    mockGetDocument.mockReturnValueOnce(makeResolvedPdf(1));

    await act(async () => render(<PDF fileUrl="/file.pdf" />));

    await waitFor(() => expect(document.querySelector('#pdf-container')).toBeInTheDocument());

    const container = document.querySelector('#pdf-container');
    expect(container?.className).toContain('pdfViewer');
    const containerStyle = container?.getAttribute('style') || '';
    expect(containerStyle).toContain('height: 100%');
    expect(containerStyle).toContain('width: 100%');
    expect(containerStyle).toContain('--page-border: none');
    expect(containerStyle).toContain('--page-margin: 0');

    const pageContainer = document.querySelector('#page-1-container');
    expect(pageContainer?.className).toContain('mb-4');
    await expect(pageContainer?.className).toMatch(/border-color|--color-theme-border/);
    expect(pageContainer?.className).toContain('relative');
    await expect(pageContainer?.className).toMatch(/\[border-width:1px\]/);
  });

  it('should dispatch renderpage for the first page on mount', async () => {
    mockGetDocument.mockReturnValueOnce(makeResolvedPdf(4));

    const dispatchSpy = jest.spyOn(mockEventBus.prototype, 'dispatch');

    await act(async () => render(<PDF fileUrl="/file.pdf" highlights={{}} />));

    expect(dispatchSpy).toHaveBeenCalledWith('renderpage', { pageNumber: 1 });
    dispatchSpy.mockRestore();
  });

  it('should trigger the pdfReady callback after rendering page 1 and unsusbcribe', async () => {
    const pdfReadySpy = jest.fn();
    const dispatchSpy = jest.spyOn(mockEventBus.prototype, 'dispatch');
    const offSpy = jest.spyOn(mockEventBus.prototype, 'off');

    mockGetDocument.mockReturnValueOnce(makeResolvedPdf(4));

    await act(async () =>
      render(
        <PDF
          fileUrl="/file.pdf"
          highlights={{}}
          onPdfReady={controls => {
            pdfReadySpy(controls);
          }}
        />
      )
    );

    expect(dispatchSpy).toHaveBeenCalledWith('pagerendered', { pageNumber: 1 });
    expect(offSpy).toHaveBeenLastCalledWith('pagerendered', expect.any(Function));
    expect(pdfReadySpy).toHaveBeenCalled();
    dispatchSpy.mockRestore();
  });

  it('should call onPageChange and dispatch render/unmount based on intersection', async () => {
    const onPageChange = jest.fn();
    mockGetDocument.mockReturnValueOnce(makeResolvedPdf(4));

    const dispatchSpy = jest.spyOn(mockEventBus.prototype, 'dispatch');

    await act(async () => render(<PDF fileUrl="/file.pdf" onPageChange={onPageChange} />));

    await waitFor(() => expect(document.querySelector('#page-1-container')).toBeInTheDocument());

    const target = document.querySelector('#page-3-container') as Element;
    // neccessary since we are mocking PDFPage component
    target.setAttribute('data-pagenumber', '3');
    const observerCallback = observers[observers.length - 1];

    await act(async () => {
      // Ensure all mount effects have run (onPageChangeReas anyf set)
    });

    act(() => {
      observerCallback(
        [{ target, intersectionRatio: 0.5, isIntersecting: true }] as any,
        {} as any
      );
    });

    await waitFor(() => expect(onPageChange).toHaveBeenCalledWith(3));
    await waitFor(() => expect(dispatchSpy).toHaveBeenCalledWith('renderpage', { pageNumber: 3 }));

    act(() => {
      observerCallback([{ target, intersectionRatio: 0, isIntersecting: false }] as any, {} as any);
    });

    await waitFor(() => expect(dispatchSpy).toHaveBeenCalledWith('unmountpage', { pageNumber: 3 }));

    dispatchSpy.mockRestore();
  });

  it('does not call onPageChange and calls onPdfReady only after PDF is rendered', async () => {
    const pdfReadySpy = jest.fn();
    const onPageChange = jest.fn();

    let resolveDoc: (value: PDFDocumentProxy) => void;

    const loadingTask: Partial<PDFDocumentLoadingTask> = {
      promise: new Promise<PDFDocumentProxy>(res => {
        resolveDoc = res;
      }),
      onProgress: jest.fn() as PDFDocumentLoadingTask['onProgress'],
    };

    mockGetDocument.mockReturnValueOnce(loadingTask);

    await act(async () => {
      await render(
        <PDF
          fileUrl="/file.pdf"
          highlights={{}}
          onPageChange={onPageChange}
          onPdfReady={pdfReadySpy}
        />
      );
    });

    expect(pdfReadySpy).not.toHaveBeenCalled();
    expect(onPageChange).not.toHaveBeenCalled();

    await act(async () => {
      resolveDoc({
        numPages: 4,
        getPage: jest
          .fn()
          .mockResolvedValue({ getViewport: () => ({ width: 100, height: 200, scale: 1 }) }),
      } as unknown as PDFDocumentProxy);
      loadingTask.onProgress?.({ percent: 100 });
    });

    await waitFor(() => expect(pdfReadySpy).toHaveBeenCalled());
    expect(onPageChange).not.toHaveBeenCalled();
  });

  it('does not call onPageChange when intersection happens before PDF is ready', async () => {
    const onPageChange = jest.fn();

    let resolveDoc: (value: PDFDocumentProxy) => void;

    const loadingTask: Partial<PDFDocumentLoadingTask> = {
      promise: new Promise<PDFDocumentProxy>(res => {
        resolveDoc = res;
      }),
      onProgress: jest.fn() as PDFDocumentLoadingTask['onProgress'],
    };

    mockGetDocument.mockReturnValueOnce(loadingTask);

    await act(async () => {
      await render(<PDF fileUrl="/file.pdf" onPageChange={onPageChange} />);
    });

    // Prepare a fake target for page 3 and call the last registered observer
    const target = document.createElement('div');
    target.setAttribute('data-pagenumber', '3');

    const observerCallback = observers[observers.length - 1];

    // Simulate intersection before PDF is resolved
    act(() => {
      observerCallback(
        [{ target, intersectionRatio: 0.6, isIntersecting: true }] as any,
        {} as any
      );
    });

    await waitFor(() => expect(onPageChange).not.toHaveBeenCalled());

    // Make PDF ready
    await act(async () => {
      resolveDoc({
        numPages: 4,
        getPage: jest
          .fn()
          .mockResolvedValue({ getViewport: () => ({ width: 100, height: 200, scale: 1 }) }),
      } as unknown as PDFDocumentProxy);
      loadingTask.onProgress?.({ percent: 100 });
    });

    // After PDF is ready, the same intersection should trigger onPageChange
    act(() => {
      observerCallback(
        [{ target, intersectionRatio: 0.6, isIntersecting: true }] as any,
        {} as any
      );
    });

    await waitFor(() => expect(onPageChange).toHaveBeenCalledWith(3));
  });
});
