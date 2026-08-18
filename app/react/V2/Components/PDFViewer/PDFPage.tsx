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

const drawPage = (pageViewer: PDFPageViewer, onError: (message: string) => void) => {
  pageViewer.draw().catch((error: unknown) => {
    if (isRenderingCancelled(error)) {
      return;
    }
    if (error instanceof Error) {
      onError(error.message);
    }
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
          if (!renderingQueue || renderingQueue.isPriority(page)) {
            drawPage(pageViewer, setError);
          }
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
    const startDrawIfAllowed = (pageViewer: PDFPageViewer) => {
      if (pageViewer.renderingState !== PDFJSViewer.RenderingStates.INITIAL) {
        return;
      }
      if (renderingQueue && !renderingQueue.isPriority(page)) {
        return;
      }
      drawPage(pageViewer, setError);
    };

    const renderPage = ({ pageNumber }: { pageNumber: number }) => {
      if (pageNumber === page && pageViewerRef.current) {
        startDrawIfAllowed(pageViewerRef.current);
      }
    };

    const unmountPage = ({ pageNumber }: { pageNumber: number }) => {
      if (pageNumber === page) {
        pageViewerRef.current?.reset();
      }
    };

    const prioritizePage = ({ pageNumber }: { pageNumber: number }) => {
      if (pageNumber === page && pageViewerRef.current) {
        startDrawIfAllowed(pageViewerRef.current);
      }
    };

    eventBus.on('renderpage', renderPage);
    eventBus.on('unmountpage', unmountPage);
    eventBus.on('prioritypage', prioritizePage);

    return () => {
      eventBus.off('renderpage', renderPage);
      eventBus.off('unmountpage', unmountPage);
      eventBus.off('prioritypage', prioritizePage);
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
