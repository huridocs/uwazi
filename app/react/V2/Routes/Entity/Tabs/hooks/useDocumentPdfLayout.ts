import { useCallback, useEffect, useState } from 'react';
import type { PDFControls } from '#V2/Components/PDFViewer/index.js';
import { useRailInset } from './useRailInset.js';

const pageElementFor = (pageNumber: number) =>
  document.querySelector<HTMLDivElement>(`.page[data-page-number="${pageNumber}"]`);

const heightOf = (pageElement: HTMLDivElement) => {
  const { height } = pageElement.getBoundingClientRect();
  return height > 0 ? height : undefined;
};

const observePageHeight = (
  pageElement: HTMLDivElement,
  setPageHeight: (height: number | undefined) => void
) => {
  const updateHeight = () => setPageHeight(heightOf(pageElement));
  updateHeight();
  const observer = new ResizeObserver(updateHeight);
  observer.observe(pageElement);
  return () => observer.disconnect();
};

function usePdfPageHeight(isRaw: boolean, pageNumber: number) {
  const [pageHeight, setPageHeight] = useState<number | undefined>();

  useEffect(() => {
    if (isRaw) {
      setPageHeight(undefined);
      return undefined;
    }
    const pageElement = pageElementFor(pageNumber);
    if (!pageElement) {
      setPageHeight(undefined);
      return undefined;
    }
    return observePageHeight(pageElement, setPageHeight);
  }, [isRaw, pageNumber]);

  return pageHeight;
}

function useDocumentPdfLayout({
  isRaw,
  pageNumber,
  showRail,
  documentId,
  ensureAnchors,
  onPdfReady,
}: {
  isRaw: boolean;
  pageNumber: number;
  showRail: boolean;
  documentId: string | undefined;
  ensureAnchors: () => Promise<void>;
  onPdfReady: (controls: PDFControls) => void;
}) {
  const [pdfScrollRoot, setPdfScrollRoot] = useState<HTMLDivElement | null>(null);
  const pageHeight = usePdfPageHeight(isRaw, pageNumber);
  const { railInsetRight, measureRailInset } = useRailInset(pdfScrollRoot, !isRaw && showRail);

  useEffect(() => {
    if (!documentId || !showRail || isRaw) return;
    ensureAnchors().catch(() => undefined);
  }, [documentId, ensureAnchors, isRaw, showRail]);

  const handlePdfReady = useCallback(
    (controls: PDFControls) => {
      onPdfReady(controls);
      measureRailInset();
    },
    [measureRailInset, onPdfReady]
  );

  return { pdfScrollRoot, setPdfScrollRoot, pageHeight, railInsetRight, handlePdfReady };
}

export { useDocumentPdfLayout };
