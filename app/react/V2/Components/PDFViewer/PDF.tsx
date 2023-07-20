/* eslint-disable max-statements */
import React, { useEffect, useRef } from 'react';
import { PDFJS, PDFJSViewer, EventBus, CMAP_URL } from './pdfjs';

interface PDFProps {
  fileUrl: string;
}

const getRenderedPages = async (fileUrl: string, container: HTMLDivElement) => {
  const file = await PDFJS.getDocument({
    url: fileUrl,
    cMapUrl: CMAP_URL,
    cMapPacked: true,
  }).promise;

  const page = await file.getPage(1);

  const pageViewer = new PDFJSViewer.PDFPageView({
    container,
    id: 1,
    scale: 1,
    defaultViewport: page.getViewport({ scale: 1 }),
    eventBus: new EventBus(),
  });

  pageViewer.setPdfPage(page);
  await pageViewer.draw();
};

const PDF = ({ fileUrl }: PDFProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = React.useState<string>();

  useEffect(() => {
    if (containerRef.current) {
      getRenderedPages(fileUrl, containerRef.current).catch((e: Error) => {
        setError(e.message);
      });
    }
  }, [fileUrl]);

  return error ? (
    <div>{error}</div>
  ) : (
    <div className="relative">
      <div className="absolute" id="something" ref={containerRef} />
    </div>
  );
};

export default PDF;
