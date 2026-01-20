import { pdfEventBus, Snippet } from '#V2/Components/PDFViewer/index.jsx';

const scrollToPage = (pageNumber: number) => {
  pdfEventBus.dispatch('goToPage', pageNumber);
};

const scrollToSnippet = (snippet: Snippet, currentPage: number) => {
  if (snippet) {
    if (currentPage !== snippet.page) {
      pdfEventBus.dispatch('goToPage', snippet.page);
    }
    setTimeout(() => {
      pdfEventBus.dispatch('activateSnippet', snippet);
    }, 200);
  }
};

export { scrollToPage, scrollToSnippet };
