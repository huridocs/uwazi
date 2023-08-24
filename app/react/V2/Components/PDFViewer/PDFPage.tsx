/* eslint-disable max-statements */
import React, { useEffect, useRef, useState } from 'react';
import { PDFDocumentProxy } from 'pdfjs-dist';
import { Highlight } from 'react-text-selection-handler';
import { EventBus, PDFJSViewer } from './pdfjs';
import { TextHighlight } from './types';

interface PDFPageProps {
  pdf: PDFDocumentProxy;
  page: number;
  highlights?: TextHighlight[];
}

const renderPage = async (file: PDFDocumentProxy, page: number, container: HTMLDivElement) => {
  const pdfPage = await file.getPage(page);

  const defaultViewport = pdfPage.getViewport({ scale: 1 });

  const pageViewer = new PDFJSViewer.PDFPageView({
    container,
    id: page,
    scale: 1,
    defaultViewport,
    annotationMode: 0,
    eventBus: new EventBus(),
  });

  pageViewer.setPdfPage(pdfPage);
  await pageViewer.draw();
};

const PDFPage = ({ pdf, page, highlights }: PDFPageProps) => {
  const pageContainerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (pageContainerRef.current) {
      renderPage(pdf, page, pageContainerRef.current).catch((e: Error) => {
        setError(e.message);
      });
    }
  });

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div ref={pageContainerRef}>
      {highlights?.map(highlight => (
        <Highlight
          key={highlight.key}
          textSelection={highlight.textSelection}
          color={highlight.color}
        />
      ))}
    </div>
  );
};

export default PDFPage;
