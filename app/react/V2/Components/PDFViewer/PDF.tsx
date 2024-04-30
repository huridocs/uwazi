import React, { useEffect, useRef, useState } from 'react';
import loadable from '@loadable/component';
import { SelectionRegion, HandleTextSelection } from '@huridocs/react-text-selection-handler';
import { TextSelection } from '@huridocs/react-text-selection-handler/dist/TextSelection';
import { PDFDocumentProxy } from 'pdfjs-dist';
import { Translate } from 'app/I18N';
import { PDFJS, CMAP_URL } from './pdfjs';
import { TextHighlight } from './types';

const PDFPage = loadable(async () => import(/* webpackChunkName: "LazyLoadPDFPage" */ './PDFPage'));

interface PDFProps {
  fileUrl: string;
  highlights?: { [page: string]: TextHighlight[] };
  onSelect?: (selection: TextSelection) => any;
  onDeselect?: () => any;
  scrollToPage?: string;
  size?: { height?: string; width?: string; overflow?: string };
}

const getPDFFile = async (fileUrl: string) =>
  PDFJS.getDocument({
    url: fileUrl,
    cMapUrl: CMAP_URL,
    cMapPacked: true,
  }).promise;

const PDF = ({
  fileUrl,
  highlights,
  onSelect = () => {},
  onDeselect,
  scrollToPage,
  size,
}: PDFProps) => {
  const scrollToRef = useRef<HTMLDivElement>(null);
  const [pdf, setPDF] = useState<PDFDocumentProxy>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    getPDFFile(fileUrl)
      .then(pdfFile => {
        setPDF(pdfFile);
      })
      .catch((e: Error) => {
        setError(e.message);
      });
  }, [fileUrl]);

  useEffect(() => {
    let animationFrameId = 0;
    let attempts = 0;

    const triggerScroll = () => {
      if (attempts > 10) {
        return;
      }

      if (scrollToRef.current && scrollToRef.current.clientHeight > 0) {
        scrollToRef.current.scrollIntoView({ behavior: 'instant' });
        attempts = 0;
        return;
      }

      attempts += 1;
      animationFrameId = requestAnimationFrame(triggerScroll);
    };

    if (pdf && scrollToPage) {
      triggerScroll();
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [scrollToPage, pdf]);

  if (error) {
    return <div>{error}</div>;
  }

  return (
    //@ts-ignore https://github.com/huridocs/uwazi/issues/6067
    <HandleTextSelection onSelect={onSelect} onDeselect={onDeselect}>
      <div
        id="pdf-container"
        style={{
          height: size?.height || 'auto',
          width: size?.width || 'auto',
          overflow: size?.overflow || 'auto',
        }}
      >
        {pdf ? (
          Array.from({ length: pdf.numPages }, (_, index) => index + 1).map(number => {
            const regionId = number.toString();
            const pageHighlights = highlights ? highlights[regionId] : undefined;
            const shouldScrollToPage = scrollToPage === regionId;
            return (
              <div
                key={`page-${regionId}`}
                className="relative"
                id={`page-${regionId}-container`}
                ref={shouldScrollToPage ? scrollToRef : undefined}
              >
                {/* @ts-ignore https://github.com/huridocs/uwazi/issues/6067 */}
                <SelectionRegion regionId={regionId}>
                  <PDFPage pdf={pdf} page={number} highlights={pageHighlights} />
                </SelectionRegion>
              </div>
            );
          })
        ) : (
          <Translate>Loading</Translate>
        )}
      </div>
    </HandleTextSelection>
  );
};

export type { PDFProps };
export default PDF;
