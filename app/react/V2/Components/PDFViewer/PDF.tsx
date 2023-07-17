/* eslint-disable max-statements */
import React, { useEffect, useRef } from 'react';
import * as pdfjs from 'pdfjs-dist';
import 'pdfjs-dist/build/pdf.worker.entry';

interface PDFProps {
  fileUrl: string;
}

const PDF = ({ fileUrl }: PDFProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadPDF = async () => {
      try {
        const loadingTask = pdfjs.getDocument(fileUrl);
        const pdf = await loadingTask.promise;

        const pageNumber = 1;
        const page = await pdf.getPage(pageNumber);

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        if (containerRef.current && context) {
          const viewport = page.getViewport({ scale: 1 });
          canvas.width = viewport.width;
          canvas.height = viewport.height;

          const renderContext = {
            canvasContext: context,
            viewport,
          };
          await page.render(renderContext).promise;

          containerRef.current.appendChild(canvas);
        }
      } catch (error) {
        console.error('Error loading PDF:', error);
      }
    };

    loadPDF();
  }, []);

  return <div ref={containerRef} />;
};

export default PDF;
