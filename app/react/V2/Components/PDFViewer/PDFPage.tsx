import React, { useEffect, useRef, useState } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { Highlight } from '@huridocs/react-text-selection-handler';
import { TextHighlight } from './types.js';
import { calculateScaling } from './functions/calculateScaling.js';
import { adjustSelectionsToScale } from './functions/handleTextSelection.js';
import { PDFJSViewer, PixelsPerInch } from './pdfjs.js';
import type { EventBusType } from './pdfjs.js';
import type { PageRenderQueue } from './functions/pageRenderQueue.js';

type PDFPageViewer = typeof PDFJSViewer.PDFPageView.prototype;

const isRenderingCancelled = (error: unknown): boolean =>
  error instanceof Error && error.name === 'RenderingCancelledException';

const drawPage = (
  pageViewer: PDFPageViewer,
  onError: (message: string) => void,
  onSettled?: () => void
) => {
  pageViewer
    .draw()
    .catch((error: unknown) => {
      if (isRenderingCancelled(error)) {
        return;
      }
      if (error instanceof Error) {
        onError(error.message);
      }
    })
    .finally(() => {
      onSettled?.();
    });
};

const enqueueDraw = (
  page: number,
  pageViewerRef: React.RefObject<PDFPageViewer | null>,
  renderingQueue: PageRenderQueue | undefined,
  onError: (message: string) => void
) => {
  const pageViewer = pageViewerRef.current;
  if (!pageViewer || pageViewer.renderingState !== PDFJSViewer.RenderingStates.INITIAL) {
    return;
  }
  if (!renderingQueue) {
    drawPage(pageViewer, onError);
    return;
  }
  renderingQueue.request(page, () => {
    const viewer = pageViewerRef.current;
    if (!viewer || viewer.renderingState !== PDFJSViewer.RenderingStates.INITIAL) {
      renderingQueue.complete(page);
      return;
    }
    drawPage(viewer, onError, () => renderingQueue.complete(page));
  });
};

interface PDFPageProps {
  pdf: PDFDocumentProxy;
  page: number;
  eventBus: EventBusType;
  intersectionObserver: IntersectionObserver | null | undefined;
  highlights?: TextHighlight[];
  onHighlightClick?: (highlightKey: string) => void;
  containerWidth?: number;
  onScaleChange?: (scale: number) => void;
  renderingQueue?: PageRenderQueue;
}

const PDFPageComponent = ({
  pdf,
  page,
  eventBus,
  intersectionObserver,
  containerWidth,
  highlights,
  onHighlightClick,
  onScaleChange,
  renderingQueue,
}: PDFPageProps) => {
  const [error, setError] = useState<string>();
  const [pdfScale, setPdfScale] = useState(1);
  const [pageHeight, setPageHeight] = useState<number>();
  const [ready, setReady] = useState(false);
  const pageContainerRef = useRef<HTMLDivElement>(null);
  const pageViewerRef = useRef<PDFPageViewer | null>(null);
  const baseViewportSizeRef = useRef<{ width: number; height: number } | null>(null);

  useEffect(() => {
    pdf
      .getPage(page)
      .then(pdfPage => {
        const container = pageContainerRef.current;
        if (container && pdfPage) {
          const defaultViewport = pdfPage.getViewport({ scale: 1 });
          const baseViewportWidth = defaultViewport.width * PixelsPerInch.PDF_TO_CSS_UNITS;
          const baseViewportHeight = defaultViewport.height * PixelsPerInch.PDF_TO_CSS_UNITS;

          baseViewportSizeRef.current = {
            width: baseViewportWidth,
            height: baseViewportHeight,
          };

          const pageViewer = new PDFJSViewer.PDFPageView({
            container,
            id: page,
            scale: defaultViewport.scale,
            defaultViewport,
            annotationMode: 0,
            eventBus,
            enableDetailCanvas: false,
          });

          pageViewer.setPdfPage(pdfPage);
          pageViewerRef.current = pageViewer;
          setReady(true);
        }
      })
      .catch((e: Error) => {
        setError(e.message);
      });
  }, [eventBus, page, pdf]);

  useEffect(() => {
    const pageViewer = pageViewerRef.current;
    const baseViewportSize = baseViewportSizeRef.current;

    if (ready && pageViewer && baseViewportSize) {
      const newScale = calculateScaling(baseViewportSize.width, containerWidth);

      if (Math.abs(pageViewer.scale - newScale) > 0.01) {
        const previousRenderingState = pageViewer.renderingState;
        const shouldRedraw = previousRenderingState !== PDFJSViewer.RenderingStates.INITIAL;
        const nextPageHeight = baseViewportSize.height * newScale;
        setPageHeight(nextPageHeight);
        setPdfScale(newScale);
        onScaleChange?.(newScale);

        pageViewer.update({ scale: newScale });

        if (shouldRedraw) {
          if (
            previousRenderingState === PDFJSViewer.RenderingStates.RUNNING ||
            previousRenderingState === PDFJSViewer.RenderingStates.PAUSED
          ) {
            pageViewer.cancelRendering();
          }

          pageViewer.reset();
          enqueueDraw(page, pageViewerRef, renderingQueue, setError);
        }
      }
    }
  }, [containerWidth, onScaleChange, ready, renderingQueue, page]);

  useEffect(() => {
    const containerRef = pageContainerRef.current;

    if (containerRef && ready) {
      intersectionObserver?.observe(containerRef);
    }

    return () => {
      if (containerRef && ready) {
        intersectionObserver?.unobserve(containerRef);
      }
    };
  }, [intersectionObserver, ready]);

  useEffect(() => {
    if (ready) {
      eventBus.dispatch('pageready', { pageNumber: page });
    }
  }, [eventBus, page, ready]);

  useEffect(() => {
    const drawIfPage = ({ pageNumber }: { pageNumber: number }) => {
      if (pageNumber === page) {
        enqueueDraw(page, pageViewerRef, renderingQueue, setError);
      }
    };

    const unmountPage = ({ pageNumber }: { pageNumber: number }) => {
      if (pageNumber !== page) {
        return;
      }
      const viewer = pageViewerRef.current;
      if (
        viewer &&
        (viewer.renderingState === PDFJSViewer.RenderingStates.RUNNING ||
          viewer.renderingState === PDFJSViewer.RenderingStates.PAUSED)
      ) {
        viewer.cancelRendering();
      }
      renderingQueue?.cancel(page);
      viewer?.reset();
    };

    eventBus.on('renderpage', drawIfPage);
    eventBus.on('unmountpage', unmountPage);
    eventBus.on('prioritypage', drawIfPage);

    return () => {
      eventBus.off('renderpage', drawIfPage);
      eventBus.off('unmountpage', unmountPage);
      eventBus.off('prioritypage', drawIfPage);
    };
  }, [eventBus, page, renderingQueue]);

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div
      ref={pageContainerRef}
      style={pageHeight ? { minHeight: `${pageHeight}px` } : undefined}
      data-testid="pdf-page"
      data-pagenumber={page}
    >
      {highlights?.map(highlight => {
        const scaledHightlight = {
          ...highlight,
          textSelection: adjustSelectionsToScale(highlight.textSelection, pdfScale),
        };

        const highlightKey = `${page}-${scaledHightlight.key}`;
        return (
          <div
            key={scaledHightlight.key}
            data-highlight-key={highlightKey}
            className={onHighlightClick ? 'cursor-pointer' : undefined}
            onClick={
              onHighlightClick
                ? () => {
                    onHighlightClick(scaledHightlight.key);
                  }
                : undefined
            }
          >
            <div style={{ pointerEvents: onHighlightClick ? 'auto' : 'none' }}>
              <Highlight
                textSelection={scaledHightlight.textSelection}
                color={scaledHightlight.color}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

const PDFPage = React.memo(PDFPageComponent);

export { PDFPage };
