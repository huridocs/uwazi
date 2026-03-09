import React, { useEffect, useRef, useState } from 'react';
import { PDFDocumentProxy, PixelsPerInch } from 'pdfjs-dist';
import { Highlight } from '@huridocs/react-text-selection-handler';
import { EventBus, PDFPageView, RenderingStates } from 'pdfjs-dist/web/pdf_viewer.mjs';
import { TextHighlight } from './types.js';
import { calculateScaling } from './functions/calculateScaling.js';
import { adjustSelectionsToScale } from './functions/handleTextSelection.js';

interface PDFPageProps {
  pdf: PDFDocumentProxy;
  page: number;
  eventBus: typeof EventBus.prototype;
  intersectionObserver: IntersectionObserver | null | undefined;
  highlights?: TextHighlight[];
  containerWidth?: number;
  onScaleChange?: (scale: number) => void;
  onPageChange?: (pageNumber: number) => void;
}

const PDFPage = ({
  pdf,
  page,
  eventBus,
  intersectionObserver,
  containerWidth,
  highlights,
  onScaleChange,
  onPageChange,
}: PDFPageProps) => {
  const [error, setError] = useState<string>();
  const [pdfScale, setPdfScale] = useState(1);
  const [pageHeight, setPageHeight] = useState<number>();
  const [ready, setReady] = useState(false);
  const pageContainerRef = useRef<HTMLDivElement>(null);
  const pageViewerRef = useRef<typeof PDFPageView.prototype | null>(null);
  const baseViewportSizeRef = useRef<{ width: number; height: number } | null>(null);
  const onPageChangeRef = useRef(onPageChange);
  onPageChangeRef.current = onPageChange;

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

          const pageViewer = new PDFPageView({
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

      const nextPageHeight = baseViewportSize.height * newScale;

      setPageHeight(previousHeight => {
        if (previousHeight && Math.abs(previousHeight - nextPageHeight) <= 0.5) {
          return previousHeight;
        }

        return nextPageHeight;
      });

      if (Math.abs(pageViewer.scale - newScale) > 0.01) {
        setPdfScale(newScale);
        onScaleChange?.(newScale);
        pageViewer.update({ scale: newScale });
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
    const renderPage = () => {
      const pageViewer = pageViewerRef.current;
      if (pageViewer?.renderingState === RenderingStates.INITIAL) {
        pageViewer?.draw().catch(e => {
          setError(e.message);
        });
      }
    };

    const unmountPage = () => {
      const pageViewer = pageViewerRef.current;
      if (pageViewer?.renderingState === RenderingStates.FINISHED) {
        pageViewer?.destroy();
      } else {
        pageViewer?.cancelRendering();
      }
    };

    eventBus.on('renderpage', ({ pageNumber }: { pageNumber: number | string }) => {
      if (pageNumber === page.toString()) {
        renderPage();
      }
    });

    eventBus.on('unmountpage', ({ pageNumber }: { pageNumber: string }) => {
      if (pageNumber === page.toString()) {
        unmountPage();
      }
    });
  }, [eventBus, page]);

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div
      ref={pageContainerRef}
      className="border mb-4 border-gray-200 relative"
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
          <div key={scaledHightlight.key} data-highlight-key={scaledHightlight.key}>
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
