/**
 * @jest-environment jsdom
 */

import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import { mockEventBus, highlights } from './fixtures.js';
import { PDFPage } from '../PDFPage';
import { EventBus } from '../pdfjs.js';
import { PageRenderQueue } from '../functions/pageRenderQueue.js';

const mockPageDraw = jest.fn();
const mockPageReset = jest.fn();
const lastPageView: { current: { renderingState: number } | null } = { current: null };

jest.mock('../pdfjs.ts', () => {
  const RenderingStates = { INITIAL: 0, RUNNING: 1, PAUSED: 2, FINISHED: 3 };

  const PDFPageView = jest.fn().mockImplementation(() => {
    const inst: {
      scale: number;
      renderingState: number;
      setPdfPage: jest.Mock;
      update: jest.Mock;
      cancelRendering: jest.Mock;
      reset: jest.Mock;
      draw: jest.Mock;
      destroy: jest.Mock;
      resume: jest.Mock;
    } = {
      scale: 1,
      renderingState: RenderingStates.INITIAL,
      setPdfPage: jest.fn(),
      update: jest.fn(),
      cancelRendering: jest.fn(),
      reset: jest.fn(),
      draw: jest.fn(),
      destroy: jest.fn(),
      resume: jest.fn(),
    };

    inst.reset = jest.fn().mockImplementation(() => {
      mockPageReset();
      inst.renderingState = RenderingStates.INITIAL;
    });

    inst.draw = jest.fn().mockImplementation(async () => {
      mockPageDraw();
      inst.renderingState = RenderingStates.FINISHED;
      return Promise.resolve();
    });

    lastPageView.current = inst;
    return inst;
  });

  return {
    EventBus: mockEventBus,
    PDFJSViewer: { PDFPageView, RenderingStates },
    PixelsPerInch: { PDF_TO_CSS_UNITS: 1 },
  };
});

describe('PDFPage', () => {
  const pdf = {
    getPage: jest
      .fn()
      .mockResolvedValue({ getViewport: () => ({ width: 100, height: 200, scale: 1 }) }),
  } as any;

  let dispatchSpy: jest.SpyInstance;

  beforeEach(() => {
    dispatchSpy = jest.spyOn(EventBus.prototype, 'dispatch');
    mockPageDraw.mockClear();
    mockPageReset.mockClear();
    lastPageView.current = null;
  });

  afterEach(() => {
    dispatchSpy.mockRestore();
  });

  it('should render the page container with the corresponding highlights', async () => {
    const eventBus = new EventBus();

    await act(async () => {
      await render(
        <PDFPage
          pdf={pdf}
          page={2}
          eventBus={eventBus}
          intersectionObserver={null}
          containerWidth={100}
          highlights={highlights![2]}
        />
      );
    });

    const page = screen.getByTestId('pdf-page');
    expect(page).toBeInTheDocument();
    expect(page.querySelector('[data-highlight-key="2-1"]')).toBeInTheDocument();
    expect(page.querySelector('[data-highlight-key="5-3"]')).not.toBeInTheDocument();
  });

  it('should emit pageready when ready', async () => {
    const eventBus = new EventBus();

    await act(async () => {
      await render(
        <PDFPage
          pdf={pdf}
          page={2}
          eventBus={eventBus}
          intersectionObserver={null}
          containerWidth={100}
          highlights={highlights![2]}
        />
      );
    });

    await waitFor(() => expect(dispatchSpy).toHaveBeenCalled());
    expect(dispatchSpy).toHaveBeenCalledWith('pageready', { pageNumber: 2 });
  });

  it('should subscribe to the intersection observer on mount and unsusbcribe on unmount', async () => {
    const observe = jest.fn();
    const unobserve = jest.fn();
    const intersectionObserver = { observe, unobserve } as any;
    const eventBus = new EventBus();

    const unmountFn = await act(async () => {
      const { unmount } = render(
        <PDFPage
          pdf={pdf}
          page={2}
          eventBus={eventBus}
          intersectionObserver={intersectionObserver}
          containerWidth={100}
          highlights={highlights![2]}
        />
      );

      return unmount;
    });

    await waitFor(() => expect(observe).toHaveBeenCalled());
    const page = screen.getByTestId('pdf-page');
    expect(observe).toHaveBeenNthCalledWith(1, page);

    unmountFn();
    expect(unobserve).toHaveBeenNthCalledWith(1, page);
  });

  it('should redraw on scale change', async () => {
    const eventBus = new EventBus();
    const onScaleChange = jest.fn();

    let rerender: any;

    await act(async () => {
      const rendered = render(
        <PDFPage
          pdf={pdf}
          page={2}
          eventBus={eventBus}
          onScaleChange={onScaleChange}
          intersectionObserver={null}
          containerWidth={100}
        />
      );
      rerender = rendered.rerender;
    });

    await waitFor(() => expect(dispatchSpy).toHaveBeenCalledWith('pageready', { pageNumber: 2 }));

    eventBus.dispatch('renderpage', { pageNumber: 2 });
    await waitFor(() => expect(mockPageDraw).toHaveBeenCalledTimes(1));

    await act(async () => {
      rerender(
        <PDFPage
          pdf={pdf}
          page={2}
          eventBus={eventBus}
          onScaleChange={onScaleChange}
          intersectionObserver={null}
          containerWidth={150}
        />
      );
    });

    await waitFor(() => expect(onScaleChange).toHaveBeenCalledWith(1.5));
    await waitFor(() => expect(mockPageDraw).toHaveBeenCalledTimes(2));
  });

  describe('render page events', () => {
    let eventBus: typeof EventBus.prototype;

    beforeEach(async () => {
      eventBus = new EventBus();

      await act(async () => {
        await render(
          <PDFPage
            pdf={pdf}
            page={2}
            eventBus={eventBus}
            intersectionObserver={null}
            containerWidth={100}
            highlights={highlights![2]}
          />
        );
      });
    });

    it('should render the page on renderpage event', async () => {
      await waitFor(() => expect(dispatchSpy).toHaveBeenCalledWith('pageready', { pageNumber: 2 }));
      expect(mockPageDraw).not.toHaveBeenCalled();
      eventBus.dispatch('renderpage', { pageNumber: 2 });

      expect(mockPageDraw).toHaveBeenCalled();
    });

    it('should not render for other page requests', async () => {
      await waitFor(() => expect(dispatchSpy).toHaveBeenCalledWith('pageready', { pageNumber: 2 }));
      expect(mockPageDraw).not.toHaveBeenCalled();
      eventBus.dispatch('renderpage', { pageNumber: 15 });

      expect(mockPageDraw).not.toHaveBeenCalled();
    });

    it('should reset the page on unmountpage so a later renderpage can draw again', async () => {
      await waitFor(() => expect(dispatchSpy).toHaveBeenCalledWith('pageready', { pageNumber: 2 }));
      eventBus.dispatch('renderpage', { pageNumber: 2 });
      expect(mockPageDraw).toHaveBeenCalledTimes(1);

      eventBus.dispatch('unmountpage', { pageNumber: 2 });
      expect(mockPageReset).toHaveBeenCalled();

      eventBus.dispatch('renderpage', { pageNumber: 2 });
      expect(mockPageDraw).toHaveBeenCalledTimes(2);
    });

    it('should not restart an in-flight render', async () => {
      await waitFor(() => expect(dispatchSpy).toHaveBeenCalledWith('pageready', { pageNumber: 2 }));
      if (!lastPageView.current) {
        throw new Error('expected page viewer');
      }
      lastPageView.current.renderingState = 1;

      eventBus.dispatch('renderpage', { pageNumber: 2 });
      expect(mockPageDraw).not.toHaveBeenCalled();
    });
  });

  it('should not draw until the page is the render priority', async () => {
    const eventBus = new EventBus();
    const renderingQueue = new PageRenderQueue();
    renderingQueue.prioritize(1);

    await act(async () => {
      await render(
        <PDFPage
          pdf={pdf}
          page={2}
          eventBus={eventBus}
          intersectionObserver={null}
          containerWidth={100}
          renderingQueue={renderingQueue}
        />
      );
    });

    await waitFor(() => expect(dispatchSpy).toHaveBeenCalledWith('pageready', { pageNumber: 2 }));
    eventBus.dispatch('renderpage', { pageNumber: 2 });
    expect(mockPageDraw).not.toHaveBeenCalled();

    renderingQueue.prioritize(2);
    eventBus.dispatch('prioritypage', { pageNumber: 2 });
    expect(mockPageDraw).toHaveBeenCalled();
  });
});
