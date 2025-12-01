import { pdfEventBus, Snippet } from 'V2/Components/PDFViewer';

const scrollToPage = (pageNumber: number) => {
  pdfEventBus.dispatch('goToPage', pageNumber);
};

const scrollToSnippet = (snippet: Snippet, currentPage: number) => {
  pdfEventBus.dispatch('deactivateSnippet');

  if (snippet) {
    if (currentPage !== snippet.page) {
      pdfEventBus.dispatch('goToPage', snippet.page);
    }
    setTimeout(() => {
      pdfEventBus.dispatch('activateSnippet', snippet);
    }, 100);
  }
};

export { scrollToPage, scrollToSnippet };
