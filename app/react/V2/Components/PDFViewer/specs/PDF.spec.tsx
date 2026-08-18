/**
 * @jest-environment jsdom
 */

import React from 'react';
import { PDFDocumentLoadingTask, PDFDocumentProxy } from 'pdfjs-dist';
import { act, render, screen, waitFor } from '@testing-library/react';
import { mockEventBus } from './fixtures.js';
import { PDF, PDFControls } from '../PDF.jsx';
import * as handleSnippets from '../functions/handleSnippets.js';

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

type MockObserver = IntersectionObserver & {
  callback: IntersectionObserverCallback;
};

const observers: MockObserver[] = [];
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

global.IntersectionObserver = jest
  .fn()
  .mockImplementation(
    (callback: IntersectionObserverCallback, options?: IntersectionObserverInit) => {
      const observer: MockObserver = {
        callback,
        root: options?.root ?? null,
        rootMargin: options?.rootMargin ?? '0px',
        thresholds: Array.isArray(options?.threshold)
          ? options.threshold
          : [options?.threshold ?? 0],
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: jest.fn(),
        takeRecords: () => [],
      };
      observers.push(observer);
      return observer;
    }
  );

global.ResizeObserver = ResizeObserverMock;

beforeEach(() => {
  mockGetDocument.mockReset();
  observers.splice(0);
});

function preloadObserver() {
  return observers.find(observer => observer.rootMargin === '500px 0px 500px 0px');
}

function visibilityObserver() {
  return observers.find(observer => observer.rootMargin === '0px');
}

function pageIntersection(
  target: Element,
  { intersecting, height }: { intersecting: boolean; height: number }
): IntersectionObserverEntry {
  return {
    target,
    isIntersecting: intersecting,
    intersectionRatio: height > 0 ? 0.5 : 0,
    intersectionRect: {
      height,
      width: 0,
      top: 0,
      left: 0,
      bottom: height,
      right: 0,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    },
    boundingClientRect: {
      height: 0,
      width: 0,
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    },
    rootBounds: null,
    time: 0,
  };
}

function intersect(observer: MockObserver, target: Element, intersecting: boolean, height = 400) {
  observer.callback([pageIntersection(target, { intersecting, height })], observer);
}

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

  it('should dispatch renderpage from the preload observer', async () => {
    mockGetDocument.mockReturnValueOnce(makeResolvedPdf(4));

    const dispatchSpy = jest.spyOn(mockEventBus.prototype, 'dispatch');

    await act(async () => render(<PDF fileUrl="/file.pdf" highlights={{}} />));

    const target = document.querySelector('#page-1-container');
    if (!target) {
      throw new Error('expected #page-1-container');
    }

    const observer = preloadObserver();
    if (!observer) {
      throw new Error('expected preload observer');
    }

    act(() => {
      observer.callback([pageIntersection(target, { intersecting: true, height: 400 })], observer);
    });

    expect(dispatchSpy).toHaveBeenCalledWith('renderpage', { pageNumber: 1 });
    dispatchSpy.mockRestore();
  });

  it('should trigger the pdfReady callback when a page is ready', async () => {
    const pdfReadySpy = jest.fn();

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

    expect(pdfReadySpy).toHaveBeenCalled();
  });

  it('should trigger the pdfReady callback when the initial page is ready', async () => {
    const pdfReadySpy = jest.fn();
    mockGetDocument.mockReturnValueOnce(makeResolvedPdf(4));

    await act(async () =>
      render(
        <PDF
          fileUrl="/file.pdf"
          initialPage={3}
          onPdfReady={controls => {
            pdfReadySpy(controls);
          }}
        />
      )
    );

    expect(pdfReadySpy).toHaveBeenCalled();
  });

  it('should call onPageChange from viewport visibility and render from preload', async () => {
    const onPageChange = jest.fn();
    mockGetDocument.mockReturnValueOnce(makeResolvedPdf(4));
    const dispatchSpy = jest.spyOn(mockEventBus.prototype, 'dispatch');

    await act(async () => render(<PDF fileUrl="/file.pdf" onPageChange={onPageChange} />));
    await waitFor(() => expect(document.querySelector('#page-1-container')).toBeInTheDocument());

    const target = document.querySelector('#page-3-container');
    const preload = preloadObserver();
    const visibility = visibilityObserver();
    if (!target || !preload || !visibility) {
      throw new Error('expected page and observers');
    }

    act(() => {
      intersect(preload, target, true);
      intersect(visibility, target, true);
    });

    await waitFor(() => expect(onPageChange).toHaveBeenCalledWith(3));
    await waitFor(() => expect(dispatchSpy).toHaveBeenCalledWith('renderpage', { pageNumber: 3 }));
    dispatchSpy.mockRestore();
  });

  it('should not unmount a viewport-visible page when it leaves the preload band', async () => {
    const onPageChange = jest.fn();
    mockGetDocument.mockReturnValueOnce(makeResolvedPdf(4));
    const dispatchSpy = jest.spyOn(mockEventBus.prototype, 'dispatch');

    await act(async () => render(<PDF fileUrl="/file.pdf" onPageChange={onPageChange} />));
    const target = document.querySelector('#page-3-container');
    const preload = preloadObserver();
    const visibility = visibilityObserver();
    if (!target || !preload || !visibility) {
      throw new Error('expected page and observers');
    }

    act(() => {
      intersect(visibility, target, true);
      intersect(preload, target, false, 0);
    });
    expect(dispatchSpy).not.toHaveBeenCalledWith('unmountpage', { pageNumber: 3 });

    act(() => {
      intersect(visibility, target, false, 0);
      intersect(preload, target, false, 0);
    });
    await waitFor(() => expect(dispatchSpy).toHaveBeenCalledWith('unmountpage', { pageNumber: 3 }));
    dispatchSpy.mockRestore();
  });

  it('should report the page with greater visible height, not the lower page number', async () => {
    const onPageChange = jest.fn();
    mockGetDocument.mockReturnValueOnce(makeResolvedPdf(4));

    await act(async () => render(<PDF fileUrl="/file.pdf" onPageChange={onPageChange} />));

    const page3 = document.querySelector('#page-3-container');
    const page4 = document.querySelector('#page-4-container');
    const visibility = visibilityObserver();
    if (!page3 || !page4 || !visibility) {
      throw new Error('expected pages and visibility observer');
    }

    act(() => {
      visibility.callback(
        [
          pageIntersection(page3, { intersecting: true, height: 200 }),
          pageIntersection(page4, { intersecting: true, height: 500 }),
        ],
        visibility
      );
    });

    await waitFor(() => expect(onPageChange).toHaveBeenCalledWith(4));
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

    const preload = preloadObserver();
    if (!preload) {
      throw new Error('expected preload observer');
    }

    act(() => {
      preload.callback([pageIntersection(target, { intersecting: true, height: 400 })], preload);
    });

    await waitFor(() => expect(onPageChange).not.toHaveBeenCalled());

    await act(async () => {
      resolveDoc({
        numPages: 4,
        getPage: jest
          .fn()
          .mockResolvedValue({ getViewport: () => ({ width: 100, height: 200, scale: 1 }) }),
      } as unknown as PDFDocumentProxy);
      loadingTask.onProgress?.({ percent: 100 });
    });

    const visibility = visibilityObserver();
    if (!visibility) {
      throw new Error('expected visibility observer');
    }

    act(() => {
      visibility.callback(
        [pageIntersection(target, { intersecting: true, height: 400 })],
        visibility
      );
    });

    await waitFor(() => expect(onPageChange).toHaveBeenCalledWith(3));
  });

  it('retries activateSnippet highlight until textLayer content is ready', async () => {
    jest.useFakeTimers({ advanceTimers: true });
    const tryHighlightSpy = jest
      .spyOn(handleSnippets, 'tryHighlightAndScroll')
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);

    mockGetDocument.mockReturnValueOnce(makeResolvedPdf(1));

    let controls: PDFControls | undefined;

    await act(async () => {
      render(
        <PDF
          fileUrl="/file.pdf"
          onPdfReady={pdfControls => {
            controls = pdfControls;
          }}
        />
      );
    });

    await waitFor(() => expect(controls).toBeDefined());

    const pageContainer = document.querySelector('#page-1-container');
    if (!(pageContainer instanceof HTMLDivElement)) {
      throw new Error('expected #page-1-container');
    }
    pageContainer.innerHTML = '<div class="textLayer"></div>';

    act(() => {
      controls?.activateSnippet({ text: 'partial <b>term</b> context', page: 1 });
    });

    await act(async () => {
      jest.advanceTimersByTime(16);
    });

    expect(tryHighlightSpy.mock.calls.length).toBeGreaterThanOrEqual(2);

    tryHighlightSpy.mockRestore();
    jest.useRealTimers();
  });
});
