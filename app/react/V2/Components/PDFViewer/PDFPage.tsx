import React, { useEffect, useRef, useState } from 'react';
import { PDFDocumentProxy } from 'pdfjs-dist';
import { EventBus, PDFJSViewer } from './pdfjs';

interface PDFPageProps {
  pdf: PDFDocumentProxy;
  page: number;
}

const renderPage = async (file: PDFDocumentProxy, page: number, container: HTMLDivElement) => {
  const pdfPage = await file.getPage(page);

  const defaultViewport = pdfPage.getViewport({ scale: 1 });

  const pageViewer = new PDFJSViewer.PDFPageView({
    container,
    id: page,
    scale: 1,
    defaultViewport,
    eventBus: new EventBus(),
  });

  pageViewer.setPdfPage(pdfPage);
  await pageViewer.draw();
};

const PDFPage = ({ pdf, page }: PDFPageProps) => {
  const pageContainerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (pageContainerRef.current) {
      renderPage(pdf, page, pageContainerRef.current).catch((e: Error) => {
        setError(e.message);
      });
    }
  }, [page, pdf]);

  return error ? (
    <div>{error}</div>
  ) : (
    <div className="relative" id={`page-${page}-container`} ref={pageContainerRef} />
  );
};

export default PDFPage;
