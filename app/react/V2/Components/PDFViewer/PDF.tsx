/* eslint-disable max-statements */
import React, { useEffect, useRef } from 'react';
import * as pdfjs from 'pdfjs-dist/webpack';

interface PDFProps {
  fileUrl: string;
}

const getRenderedPages = async (fileUrl: string) => {
  const loadingTask = pdfjs.getDocument(fileUrl);
  const file = await loadingTask.promise;

  const pageNumbers = Array.from({ length: file.numPages }, (_, index) => index + 1);

  const renderedPages = await Promise.all(
    pageNumbers.map(async pageNumber => {
      const page = await file.getPage(pageNumber);

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      if (context) {
        const viewport = page.getViewport({ scale: 1 });
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const renderContext = {
          canvasContext: context,
          viewport,
        };

        await page.render(renderContext).promise;
      }

      return canvas;
    })
  );

  return renderedPages;
};

const PDF = ({ fileUrl }: PDFProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = React.useState<string>();

  useEffect(() => {
    if (containerRef.current) {
      getRenderedPages(fileUrl)
        .then(canvases => {
          canvases.map(canvas => containerRef!.current!.appendChild(canvas));
        })

        .catch((e: Error) => {
          setError(e.message);
        });
    }
  }, [fileUrl]);

  return error ? <div>{error}</div> : <div ref={containerRef} />;
};

export default PDF;
