import type { TextSelection } from '@huridocs/react-text-selection-handler';
import type { PropertySelectionSchema } from '#shared/types/commonTypes.js';

type PdfFillCoerceType = 'text' | 'date' | 'numeric';

type PdfFillTarget = {
  name: string;
  propertyId?: string;
  coerceType: PdfFillCoerceType;
};

type PdfFillHost = {
  isEditing: boolean;
  language: string;
  documentLanguage?: string;
  savedPropertySelections?: PropertySelectionSchema[];
  documentPdfSelection: TextSelection | undefined;
  draftPropertySelections: PropertySelectionSchema[];
  upsertPropertySelection: (
    property: { name: string; id?: string },
    selection: TextSelection
  ) => void;
  clearPropertySelection: (property: { name: string; id?: string }) => void;
  setDocumentPdfSelection: (selection: TextSelection | undefined) => void;
  setPdfSelectionMenuOpen: (open: boolean) => void;
};

type PdfFillPlacement = 'overlay' | 'beside';

export type { PdfFillCoerceType, PdfFillTarget, PdfFillHost, PdfFillPlacement };
