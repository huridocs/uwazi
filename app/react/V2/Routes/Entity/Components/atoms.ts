import { atom } from 'jotai';
import { PDFControls } from '#app/V2/Components/PDFViewer/index.js';

const searchHintsModalAtom = atom(false);

const pdfController = atom<PDFControls | null>(null);

const activeRelationshipIdAtom = atom<string | null>(null);

const scrollToRelationshipPanelAtom = atom<string | null>(null);

export {
  searchHintsModalAtom,
  pdfController,
  activeRelationshipIdAtom,
  scrollToRelationshipPanelAtom,
};
