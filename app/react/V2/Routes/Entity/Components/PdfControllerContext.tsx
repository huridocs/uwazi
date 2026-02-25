import type { RefObject } from 'react';
import type { PDFHandle, Snippet } from '#V2/Components/PDFViewer/index.js';

export type PdfControllerApi = {
  goToPage: (pageNumber: number) => void;
  scrollToHighlight: (highlightKey: string) => void;
  activateSnippet: (snippet: Snippet) => void;
  deactivateSnippet: () => void;
  scrollToSnippet: (snippet: Snippet, currentPage: number) => void;
};

/**
 * Creates a controller that forwards calls to the main PDF instance.
 * Pass the ref that is attached to the main (left) PDF; consumers receive
 * this api explicitly via props (no context).
 */
export function createPdfController(pdfRef: RefObject<PDFHandle | null>): PdfControllerApi {
  return {
    goToPage(pageNumber: number) {
      pdfRef.current?.goToPage(pageNumber);
    },
    scrollToHighlight(highlightKey: string) {
      pdfRef.current?.scrollToHighlight(highlightKey);
    },
    activateSnippet(snippet: Snippet) {
      pdfRef.current?.activateSnippet(snippet);
    },
    deactivateSnippet() {
      pdfRef.current?.deactivateSnippet();
    },
    scrollToSnippet(snippet: Snippet, currentPage: number) {
      if (!snippet) return;
      if (currentPage !== snippet.page) {
        pdfRef.current?.goToPage(snippet.page);
      }
      setTimeout(() => {
        pdfRef.current?.activateSnippet(snippet);
      }, 200);
    },
  };
}
