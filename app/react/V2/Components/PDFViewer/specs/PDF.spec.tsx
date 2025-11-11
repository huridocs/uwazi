/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, act, queryAllByAttribute, cleanup, RenderResult } from '@testing-library/react';
import { configMocks, mockIntersectionObserver } from 'jsdom-testing-mocks';
import { pdfScaleAtom } from 'V2/atoms';
import { TestAtomStoreProvider } from 'V2/testing';
import PDF, { PDFProps } from '../PDF';
import * as helpers from '../functions/helpers';

configMocks({ act });
const oberserverMock = mockIntersectionObserver();

class ResizeObserverMock {
  callback: ResizeObserverCallback;

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }

  observe = jest.fn();

  unobserve = jest.fn();

  disconnect = jest.fn();
}

global.ResizeObserver = ResizeObserverMock as any;

const highlights: PDFProps['highlights'] = {
  2: [
    {
      key: '2',
      textSelection: { selectionRectangles: [{ top: 20, width: 100, left: 0, height: 30 }] },
      color: 'red',
    },
  ],
};

const mockPageRender = jest.fn();
const mockPageDestroy = jest.fn();
const mockPageViewer = jest.fn();
const mockGetDocument = jest.fn();

const mockPageViewerInstances: any[] = [];

const renderingStates = {
  INITIAL: 0,
  RUNNING: 1,
  PAUSED: 2,
  FINISHED: 3,
};

jest.mock('../pdfjs.ts', () => ({
  EventBus: jest.fn(),
  PDFJS: {
    getDocument: jest.fn(args => {
      mockGetDocument(args);
      return {
        promise: Promise.resolve({
          numPages: 5,
          getPage: jest.fn(async () =>
            Promise.resolve({
              getViewport: () => ({ width: 100, height: 300 }),
            })
          ),
        }),
      };
    }),
    PixelsPerInch: { PDF_TO_CSS_UNITS: 0.5 },
  },
  PDFJSViewer: {
    PDFPageView: jest.fn().mockImplementation(args => {
      mockPageViewer(args);
      const instance = {
        setPdfPage: jest.fn(),
        draw: jest.fn().mockImplementation(async () => {
          mockPageRender();
          return Promise.resolve();
        }),
        destroy: mockPageDestroy,
        renderingState: 0,
        scale: args.scale,
        update: jest.fn(),
        cancelRendering: jest.fn(),
      };
      mockPageViewerInstances.push(instance);
      return instance;
    }),
    RenderingStates: renderingStates,
  },
  CMAP_URL: 'legacy_character_maps',
}));

describe('PDF', () => {
  let renderResult: RenderResult;

  const renderComponet = (scrollToPage?: PDFProps['scrollToPage']) => {
    renderResult = render(
      <TestAtomStoreProvider initialValues={[[pdfScaleAtom, 1.5]]}>
        <PDF fileUrl="url/of/file.pdf" scrollToPage={scrollToPage} highlights={highlights} />
      </TestAtomStoreProvider>
    );
  };

  beforeAll(() => {
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
      configurable: true,
      value: 100,
    });
  });

  beforeEach(() => {
    jest.spyOn(helpers, 'triggerScroll');
    jest.spyOn(window, 'requestAnimationFrame');
    jest.spyOn(pdfScaleAtom, 'write');
  });

  afterEach(() => {
    jest.clearAllMocks();
    cleanup();
  });

  afterAll(() => {
    oberserverMock.cleanup();
  });

  it('should render the pdf file', async () => {
    await act(() => {
      renderComponet();
    });
    const { container } = renderResult;
    const page1 = queryAllByAttribute('class', container, 'pdf-page')[0];
    await act(() => {
      oberserverMock.enterNode(page1);
    });
    expect(mockGetDocument).toHaveBeenCalledWith({
      cMapPacked: true,
      cMapUrl: 'legacy_character_maps',
      isEvalSupported: false,
      url: 'url/of/file.pdf',
    });
    expect(mockPageViewer).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        annotationMode: 0,
        defaultViewport: {
          height: 300,
          width: 100,
        },
        eventBus: {},
        id: 1,
        scale: 1.6,
      })
    );
    expect(mockPageRender).toHaveBeenCalled();
    expect(pdfScaleAtom.write).toHaveBeenCalled();
    expect(container).toMatchSnapshot();
  });

  it('should scroll to page', async () => {
    await act(() => {
      renderComponet('2');
    });
    expect(helpers.triggerScroll).toHaveBeenCalledTimes(1);
  });

  describe('intersection observer', () => {
    const observerMock = jest.fn();
    const unobserveMock = jest.fn();

    beforeEach(() => {
      window.IntersectionObserver = jest.fn().mockImplementation(() => ({
        observe: observerMock,
        unobserve: unobserveMock,
      }));
    });

    it('should set the observers on mount and clear them on unmount', async () => {
      await act(() => {
        renderComponet();
      });

      expect(observerMock).toHaveBeenCalledTimes(5);

      cleanup();

      expect(unobserveMock).toHaveBeenCalledTimes(5);
    });
  });

  describe('resize observer', () => {
    let resizeObserverInstance: ResizeObserverMock | null = null;

    beforeEach(() => {
      jest.clearAllMocks();
      const OriginalResizeObserver = global.ResizeObserver;
      global.ResizeObserver = jest.fn().mockImplementation((callback: ResizeObserverCallback) => {
        resizeObserverInstance = new (OriginalResizeObserver as any)(callback);
        return resizeObserverInstance;
      }) as any;
      mockPageViewerInstances.length = 0;
    });

    afterEach(() => {
      resizeObserverInstance = null;
    });

    it('should set up ResizeObserver for the PDF container', async () => {
      await act(() => {
        renderComponet();
      });

      expect(resizeObserverInstance?.observe).toHaveBeenCalledTimes(1);
    });

    it('should disconnect ResizeObserver on unmount', async () => {
      await act(() => {
        renderComponet();
      });

      cleanup();

      expect(resizeObserverInstance?.disconnect).toHaveBeenCalledTimes(1);
    });

    it('re-draws when containerWidth changes', async () => {
      let result: RenderResult;
      await act(async () => {
        result = render(
          <TestAtomStoreProvider initialValues={[[pdfScaleAtom, 1]]}>
            <PDF fileUrl="url/of/file.pdf" highlights={highlights} />
          </TestAtomStoreProvider>
        );
      });

      const page1 = result!.container.querySelector('.pdf-page') as HTMLElement;

      await act(() => {
        oberserverMock.enterNode(page1);
      });

      const instance = mockPageViewerInstances[mockPageViewerInstances.length - 1];
      instance.renderingState = renderingStates.FINISHED;

      mockPageRender.mockClear();

      jest.useFakeTimers();

      await act(async () => {
        const entries: any = [
          {
            target: result.container,
            contentRect: { width: 50 },
          },
        ];

        resizeObserverInstance!.callback(entries, resizeObserverInstance as any);
        jest.advanceTimersByTime(200);
      });

      jest.useRealTimers();

      expect(mockPageRender).toHaveBeenCalled();
    });
  });
});
