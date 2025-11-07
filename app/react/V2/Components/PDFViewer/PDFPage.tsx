/* eslint-disable max-statements */
import React, { useEffect, useRef, useState } from 'react';
import { PDFDocumentProxy } from 'pdfjs-dist';
import { Highlight } from '@huridocs/react-text-selection-handler';
import { useAtom } from 'jotai';
import { pdfScaleAtom } from 'V2/atoms';
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
}

const PDFPage = ({ pdf, page, eventBus, containerWidth, highlights }: PDFPageProps) => {
  const [error, setError] = useState<string>();
  const [pdfScale, setPdfScale] = useAtom(pdfScaleAtom);
  const pageContainerRef = useRef<HTMLDivElement>(null);
  const pageViewerRef = useRef<any>(null);
  const pdfPageRef = useRef<any>(null);

  // Initial setup - only runs once
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
              if (pageViewer.renderingState === PDFJSViewer.RenderingStates.INITIAL) {
                pageViewer.draw().catch(e => {
                  setError(e.message);
                });
              }
            } else {
              if (pageViewer.renderingState === PDFJSViewer.RenderingStates.INITIAL) {
                pageViewer.cancelRendering();
              }
              if (pageViewer.renderingState === PDFJSViewer.RenderingStates.FINISHED) {
                pageViewer.destroy();
              }
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
      if (currentContainer && observer) observer.unobserve(currentContainer);
      if (pageViewerRef.current) {
        pageViewerRef.current.destroy();
      }
    };
    //pdf rendering is expensive and we want to make sure there's a single effect that runs only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update scale dynamically when containerWidth changes
  useEffect(() => {
    const pageViewer = pageViewerRef.current;
    const pdfPage = pdfPageRef.current;

    if (!pageViewer || !pdfPage || !containerWidth) return;

    const originalViewport = pdfPage.getViewport({ scale: 1 });
    const newScale = calculateScaling(
      originalViewport.width * PDFJS.PixelsPerInch.PDF_TO_CSS_UNITS,
      containerWidth
    );

    // Only update if scale actually changed
    if (Math.abs(pageViewer.scale - newScale) > 0.01) {
      setPdfScale(newScale);

      // Update the viewer's scale
      pageViewer.update({ scale: newScale });

      // If the page is already rendered, re-draw it at the new scale
      if (pageViewer.renderingState === PDFJSViewer.RenderingStates.FINISHED) {
        pageViewer.draw().catch((e: Error) => {
          setError(e.message);
        });
      }
    }
  }, [containerWidth, setPdfScale]);

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div ref={pageContainerRef} className="pdf-page">
      {highlights?.map(highlight => {
        const scaledHightlight = {
          ...highlight,
          textSelection: adjustSelectionsToScale(highlight.textSelection, pdfScale),
        };
        return (
          <Highlight
            key={scaledHightlight.key}
            textSelection={scaledHightlight.textSelection}
            color={scaledHightlight.color}
          />
        );
      })}
    </div>
  );
};

export default PDFPage;
