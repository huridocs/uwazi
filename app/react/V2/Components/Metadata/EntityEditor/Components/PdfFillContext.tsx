import React, { createContext, useContext } from 'react';
import type { PdfFillHost } from './pdfFillTypes.js';

const noop = () => undefined;

const defaultPdfFillHost: PdfFillHost = {
  isEditing: false,
  language: 'en',
  documentPdfSelection: undefined,
  draftPropertySelections: [],
  upsertPropertySelection: noop,
  clearPropertySelection: noop,
  setDocumentPdfSelection: noop,
  setPdfSelectionMenuOpen: noop,
};

const PdfFillContext = createContext<PdfFillHost>(defaultPdfFillHost);

// Hierarchy: DocumentInteraction owns draft/PDF selection; MetadataTab builds PdfFillHost
// and wraps EditEntity with PdfFillProvider; fields read via usePdfFill().
const PdfFillProvider = ({
  value,
  children,
}: {
  value: PdfFillHost;
  children: React.ReactNode;
}) => <PdfFillContext.Provider value={value}>{children}</PdfFillContext.Provider>;

const usePdfFill = () => useContext(PdfFillContext);

export { PdfFillProvider, usePdfFill, defaultPdfFillHost };
