import { atom } from 'jotai';
import type { TextSelection } from '@huridocs/react-text-selection-handler';
import { PDFControls } from '#app/V2/Components/PDFViewer/index.js';

const searchHintsModalAtom = atom(false);

const pdfController = atom<PDFControls | null>(null);

const documentPdfSelectionAtom = atom<TextSelection | undefined>(undefined);

export { searchHintsModalAtom, pdfController, documentPdfSelectionAtom };
