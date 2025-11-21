import { pdfEventBus } from 'V2/Components/PDFViewer';

const scrollToPage = (pageNumber: number) => {
  pdfEventBus.dispatch('goToPage', pageNumber);
};

export { scrollToPage };
