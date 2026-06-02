import { atom } from 'jotai';
import { PDFControls } from '#app/V2/Components/PDFViewer/index.js';

const searchHintsModalAtom = atom(false);

const pdfController = atom<PDFControls | null>(null);

export { searchHintsModalAtom, pdfController };
