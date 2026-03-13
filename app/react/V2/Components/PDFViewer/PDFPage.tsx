import React, { useEffect, useRef, useState } from 'react';
import { PDFDocumentProxy, PixelsPerInch } from 'pdfjs-dist';
import { Highlight } from '@huridocs/react-text-selection-handler';
import { TextHighlight } from './types.js';
import { calculateScaling } from './functions/calculateScaling.js';
import { adjustSelectionsToScale } from './functions/handleTextSelection.js';
import { EventBus, PDFJSViewer } from './pdfjs.js';

interface PDFPageProps {
  pdf: PDFDocumentProxy;
  page: number;
  eventBus: typeof EventBus.prototype;
  intersectionObserver: IntersectionObserver | null | undefined;
  highlights?: TextHighlight[];
  containerWidth?: number;
  onScaleChange?: (scale: number) => void;
}

const PDFPage = ({
  pdf,
  page,
  eventBus,
  intersectionObserver,
  containerWidth,
  highlights,
  onScaleChange,
}: PDFPageProps) => {
  const [error, setError] = useState<string>();
  const [pdfScale, setPdfScale] = useState(1);
  const [pageHeight, setPageHeight] = useState<number>();
  const [ready, setReady] = useState(false);
  const pageContainerRef = useRef<HTMLDivElement>(null);
  const pageViewerRef = useRef<typeof PDFJSViewer.PDFPageView.prototype | null>(null);
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

          pageViewer.draw().catch((e: Error) => {
            setError(e.message);
          });
        }
      }
    }
  }, [containerWidth, onScaleChange, ready]);

  useEffect(() => {
    const containerRef = pageContainerRef.current;

    if (containerRef && ready) {
      intersectionObserver?.observe(containerRef);
    }

    return () => {
      if (containerRef) {
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
    const renderPage = ({ pageNumber }: { pageNumber: number }) => {
      if (pageNumber === page) {
        const pageViewer = pageViewerRef.current;
        if (pageViewer?.renderingState === PDFJSViewer.RenderingStates.INITIAL) {
          pageViewer?.draw().catch(e => {
            setError(e.message);
          });
        }
      }
    };

    const unmountPage = ({ pageNumber }: { pageNumber: number }) => {
      if (pageNumber === page) {
        const pageViewer = pageViewerRef.current;
        if (pageViewer?.renderingState === PDFJSViewer.RenderingStates.FINISHED) {
          pageViewer?.destroy();
        } else {
          pageViewer?.cancelRendering();
        }
      }
    };

    eventBus.on('renderpage', renderPage);
    eventBus.on('unmountpage', unmountPage);

    return () => {
      eventBus.off('renderpage', renderPage);
      eventBus.off('unmountpage', unmountPage);
    };
  }, [eventBus, page]);

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

        return (
          <div key={scaledHightlight.key} data-highlight-key={`${page}-${scaledHightlight.key}`}>
            <Highlight
              textSelection={scaledHightlight.textSelection}
              color={scaledHightlight.color}
            />
          </div>
        );
      })}
    </div>
  );
};

export { PDFPage };
