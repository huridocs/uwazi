/* eslint-disable max-statements */
import React, { useEffect, useRef, useState } from 'react';
import { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';
import { Highlight } from '@huridocs/react-text-selection-handler';
import { EventBus, PDFJSViewer, PDFJS } from './pdfjs';
import { TextHighlight } from './types';
import { calculateScaling } from './functions/calculateScaling';
import { adjustSelectionsToScale } from './functions/handleTextSelection';

interface PDFPageProps {
  pdf: PDFDocumentProxy;
  page: number;
  eventBus: typeof EventBus.prototype;
  highlights?: TextHighlight[];
  containerWidth?: number;
  /** Called when scale is computed/updated so parent can use it (e.g. to normalize selections) */
  onScaleChange?: (scale: number) => void;
  /** Called when this page has been drawn (replaces pdfEventBus onPageChange) */
  onPageChange?: (pageNumber: number) => void;
}

const PDFPage = ({
  pdf,
  page,
  eventBus,
  containerWidth,
  highlights,
  onScaleChange,
  onPageChange,
}: PDFPageProps) => {
  const [error, setError] = useState<string>();
  const [pdfScale, setPdfScale] = useState(1);
  const pageContainerRef = useRef<HTMLDivElement>(null);
  const pageViewerRef = useRef<typeof PDFJSViewer.PDFPageView.prototype | null>(null);
  const pdfPageRef = useRef<PDFPageProxy | null>(null);
  const onPageChangeRef = useRef(onPageChange);
  onPageChangeRef.current = onPageChange;

  useEffect(() => {
    const currentContainer = pageContainerRef.current;
    let observer: IntersectionObserver;

    pdf
      .getPage(page)
      .then(pdfPage => {
        if (currentContainer && pdfPage) {
          pdfPageRef.current = pdfPage;

          const originalViewport = pdfPage.getViewport({ scale: 1 });
          const scale = calculateScaling(
            originalViewport.width * PDFJS.PixelsPerInch.PDF_TO_CSS_UNITS,
            containerWidth
          );
          const defaultViewport = pdfPage.getViewport({ scale });

          setPdfScale(scale);
          onScaleChange?.(scale);

          const pageViewer = new PDFJSViewer.PDFPageView({
            container: currentContainer,
            id: page,
            scale,
            defaultViewport,
            annotationMode: 0,
            eventBus,
          });

          pageViewer.setPdfPage(pdfPage);
          pageViewerRef.current = pageViewer;

          const handleIntersection: IntersectionObserverCallback = entries => {
            const [entry] = entries;
            if (entry.isIntersecting) {
              pageViewer.update({ scale: pageViewer.scale });

              if (pageViewer.renderingState !== PDFJSViewer.RenderingStates.RUNNING) {
                pageViewer
                  .draw()
                  .then(() => {
                    onPageChangeRef.current?.(pdfPage.pageNumber);
                  })
                  .catch(e => {
                    setError(e.message);
                  });
              }
            } else if (pageViewer.renderingState === PDFJSViewer.RenderingStates.FINISHED) {
              pageViewer.destroy();
            }
          };

          observer = new IntersectionObserver(handleIntersection, {
            root: null,
            threshold: 0.1,
          });

          observer.observe(currentContainer);
        }
      })
      .catch((e: Error) => {
        setError(e.message);
      });

    return () => {
      if (currentContainer && observer) {
        observer.unobserve(currentContainer);
      }

      if (pageViewerRef.current) {
        pageViewerRef.current.destroy();
      }
    };
    // pdf rendering is expensive and we want to make sure there's a single effect that runs only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const pageViewer = pageViewerRef.current;
    const pdfPage = pdfPageRef.current;

    if (pageViewer && pdfPage && containerWidth) {
      const originalViewport = pdfPage.getViewport({ scale: 1 });
      const newScale = calculateScaling(
        originalViewport.width * PDFJS.PixelsPerInch.PDF_TO_CSS_UNITS,
        containerWidth
      );

      if (Math.abs(pageViewer.scale - newScale) > 0.01) {
        setPdfScale(newScale);
        onScaleChange?.(newScale);
        pageViewer.update({ scale: newScale });

        if (pageViewer.renderingState === PDFJSViewer.RenderingStates.FINISHED) {
          pageViewer.draw().catch((e: Error) => {
            setError(e.message);
          });
        }
      }
    }
  }, [containerWidth, onScaleChange]);

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div
      ref={pageContainerRef}
      className="relative border mb-4 border-gray-200"
      data-testid="pdf-page"
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
