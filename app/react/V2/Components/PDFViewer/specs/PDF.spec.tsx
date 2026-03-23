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

function makeResolvedPdf(numPages = 4) {
  return {
    promise: Promise.resolve({
      numPages,
      getPage: jest
        .fn()
        .mockResolvedValue({ getViewport: () => ({ width: 100, height: 200, scale: 1 }) }),
    }),
    onProgress: jest.fn(),
  };
}

describe('PDF', () => {
  it('should show a loading message', async () => {
    let resolveDoc: (value: PDFDocumentProxy) => void;

    const loadingTask: Partial<PDFDocumentLoadingTask> = {
      promise: new Promise<PDFDocumentProxy>(res => {
        resolveDoc = res;
      }),
      onProgress: jest.fn() as PDFDocumentLoadingTask['onProgress'],
    };

    mockGetDocument.mockReturnValueOnce(loadingTask);

    await act(async () => {
      await render(<PDF fileUrl="/file.pdf" />);
    });

    expect(mockGetDocument).toHaveBeenNthCalledWith(1, {
      url: '/file.pdf',
      cMapUrl: '/legacy_character_maps/',
      cMapPacked: true,
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
    expect(pageContainer?.className).toContain('border-gray-200');
    expect(pageContainer?.className).toContain('relative');
    const pageStyle = pageContainer?.getAttribute('style') || '';
    expect(pageStyle).toContain('border-width: 1px');
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
});
