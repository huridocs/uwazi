import React, { Suspense, useEffect, useState } from 'react';
import loadable from '@loadable/component';
import { SelectionRegion, HandleTextSelection } from 'react-text-selection-handler';
import { TextSelection } from 'react-text-selection-handler/dist/TextSelection';
import { PDFDocumentProxy } from 'pdfjs-dist';
import { Translate } from 'app/I18N';
import { PDFJS, CMAP_URL } from './pdfjs';

const PDFPage = loadable(async () => import(/* webpackChunkName: "LazyLoadPDFPage" */ './PDFPage'));

interface PDFProps {
  fileUrl: string;
  onSelect?: (selection: TextSelection) => any;
  onDeselect?: () => any;
}

const getPDFFile = async (fileUrl: string) =>
  PDFJS.getDocument({
    url: fileUrl,
    cMapUrl: CMAP_URL,
    cMapPacked: true,
  }).promise;

const PDF = ({ fileUrl, onSelect = () => {}, onDeselect }: PDFProps) => {
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

  return error ? (
    <div>{error}</div>
  ) : (
    <HandleTextSelection onSelect={onSelect} onDeselect={onDeselect}>
      <div id="pdf-container">
        {pdf &&
          Array.from({ length: pdf.numPages }, (_, index) => index + 1).map(page => (
            <Suspense key={`page-${page}`} fallback={<Translate>Loading</Translate>}>
              <SelectionRegion regionId={page.toString()}>
                <PDFPage pdf={pdf} page={page} />
              </SelectionRegion>
            </Suspense>
          ))}
      </div>
    </HandleTextSelection>
  );
};

export type { PDFProps };
export default PDF;
