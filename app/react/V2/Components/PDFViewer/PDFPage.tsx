/* eslint-disable max-statements */
import React, { useEffect, useRef, useState } from 'react';
import { PDFDocumentProxy, PDFPageProxy, PixelsPerInch } from 'pdfjs-dist';
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
  const [ready, setReady] = useState(false);
  const pageContainerRef = useRef<HTMLDivElement>(null);
  const pageViewerRef = useRef<typeof PDFPageView.prototype | null>(null);
  const pdfPageRef = useRef<PDFPageProxy | null>(null);
  const onPageChangeRef = useRef(onPageChange);
  onPageChangeRef.current = onPageChange;

  useEffect(() => {
    pdf
      .getPage(page)
      .then(pdfPage => {
        const currentContainer = pageContainerRef.current;
        if (currentContainer && pdfPage) {
          pdfPageRef.current = pdfPage;

          const defaultViewport = pdfPage.getViewport({ scale: 1 });

          const pageViewer = new PDFPageView({
            container: currentContainer,
            id: page,
            scale: 1,
            defaultViewport,
            annotationMode: 0,
            eventBus,
          });

          pageViewer.setPdfPage(pdfPage);
          pageViewerRef.current = pageViewer;
        }
      })
      .catch((e: Error) => {
        setError(e.message);
      });
  }, [eventBus, page, pdf]);

  useEffect(() => {
    const pageViewer = pageViewerRef.current;
    const pdfPage = pdfPageRef.current;

    if (pageViewer && pdfPage && containerWidth) {
      const originalViewport = pdfPage.getViewport({ scale: 1 });
      const newScale = calculateScaling(
        originalViewport.width * PixelsPerInch.PDF_TO_CSS_UNITS,
        containerWidth
      );

      if (Math.abs(pageViewer.scale - newScale) > 0.01) {
        setPdfScale(newScale);
        onScaleChange?.(newScale);
        pageViewer.update({ scale: newScale });
      }

      setReady(true);
    }
  }, [containerWidth, onScaleChange]);

  useEffect(() => {
    if (ready && pageContainerRef.current && intersectionObserver && pageViewerRef.current) {
      intersectionObserver.observe(pageContainerRef.current);

      const shouldRender = page === 1;

      if (shouldRender) {
        if (pageViewerRef.current.renderingState === RenderingStates.INITIAL) {
          // pageViewerRef.current.draw().catch(e => {
          //   setError(e.message);
          // });
        }
      }
    }
  }, [intersectionObserver, page, ready]);

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
