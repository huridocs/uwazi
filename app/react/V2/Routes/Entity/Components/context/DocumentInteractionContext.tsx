import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { TextSelection } from '@huridocs/react-text-selection-handler';
import type { PropertySelectionSchema } from '#shared/types/commonTypes.js';
import type { PDFControls } from '#V2/Components/PDFViewer/index.js';
import { useMetadataEditing } from './MetadataEditingContext.js';
import {
  clearDraftSelection,
  upsertDraftSelection,
} from '#V2/Components/Metadata/EntityEditor/functions/propertySelectionHelpers.js';

type DocumentPdfState = {
  pdfController: PDFControls | null;
  documentPdfSelection: TextSelection | undefined;
  pdfSelectionMenuOpen: boolean;
  draftPropertySelections: PropertySelectionSchema[];
};

type DocumentPdfActions = {
  setPdfController: React.Dispatch<React.SetStateAction<PDFControls | null>>;
  setDocumentPdfSelection: React.Dispatch<React.SetStateAction<TextSelection | undefined>>;
  setPdfSelectionMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  upsertPropertySelection: (
    property: { name: string; id?: string },
    selection: TextSelection
  ) => void;
  clearPropertySelection: (property: { name: string; id?: string }) => void;
  resetDraftPropertySelections: () => void;
};

type DocumentRelationshipNavState = {
  activeRelationshipId: string | null;
  scrollToRelationshipPanel: string | null;
};

type DocumentRelationshipNavActions = {
  setActiveRelationshipId: React.Dispatch<React.SetStateAction<string | null>>;
  setScrollToRelationshipPanel: React.Dispatch<React.SetStateAction<string | null>>;
};

const DocumentPdfStateContext = createContext<DocumentPdfState | null>(null);
const DocumentPdfActionsContext = createContext<DocumentPdfActions | null>(null);
const DocumentRelationshipNavStateContext = createContext<DocumentRelationshipNavState | null>(
  null
);
const DocumentRelationshipNavActionsContext = createContext<DocumentRelationshipNavActions | null>(
  null
);

const ResetPdfFillStateOnEditEnd = ({
  resetDraftPropertySelections,
  setDocumentPdfSelection,
  setPdfSelectionMenuOpen,
}: {
  resetDraftPropertySelections: () => void;
  setDocumentPdfSelection: React.Dispatch<React.SetStateAction<TextSelection | undefined>>;
  setPdfSelectionMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const { isEditing } = useMetadataEditing();
  const wasEditing = useRef(false);

  useEffect(() => {
    if (wasEditing.current && !isEditing) {
      resetDraftPropertySelections();
      setDocumentPdfSelection(undefined);
      setPdfSelectionMenuOpen(false);
    }
    wasEditing.current = isEditing;
  }, [isEditing, resetDraftPropertySelections, setDocumentPdfSelection, setPdfSelectionMenuOpen]);

  return null;
};

const DocumentInteractionProvider = ({ children }: { children: React.ReactNode }) => {
  const [pdfController, setPdfController] = useState<PDFControls | null>(null);
  const [documentPdfSelection, setDocumentPdfSelection] = useState<TextSelection>();
  const [pdfSelectionMenuOpen, setPdfSelectionMenuOpen] = useState(false);
  const [draftPropertySelections, setDraftPropertySelections] = useState<PropertySelectionSchema[]>(
    []
  );
  const [activeRelationshipId, setActiveRelationshipId] = useState<string | null>(null);
  const [scrollToRelationshipPanel, setScrollToRelationshipPanel] = useState<string | null>(null);

  const resetDraftPropertySelections = useCallback(() => {
    setDraftPropertySelections([]);
  }, []);

  const upsertPropertySelection = useCallback(
    (property: { name: string; id?: string }, selection: TextSelection) => {
      setDraftPropertySelections(prev => upsertDraftSelection(prev, property, selection));
    },
    []
  );

  const clearPropertySelection = useCallback((property: { name: string; id?: string }) => {
    setDraftPropertySelections(prev => clearDraftSelection(prev, property));
  }, []);

  const pdfState = useMemo(
    () => ({
      pdfController,
      documentPdfSelection,
      pdfSelectionMenuOpen,
      draftPropertySelections,
    }),
    [pdfController, documentPdfSelection, pdfSelectionMenuOpen, draftPropertySelections]
  );
  const pdfActions = useMemo(
    () => ({
      setPdfController,
      setDocumentPdfSelection,
      setPdfSelectionMenuOpen,
      upsertPropertySelection,
      clearPropertySelection,
      resetDraftPropertySelections,
    }),
    [upsertPropertySelection, clearPropertySelection, resetDraftPropertySelections]
  );
  const navState = useMemo(
    () => ({ activeRelationshipId, scrollToRelationshipPanel }),
    [activeRelationshipId, scrollToRelationshipPanel]
  );
  const navActions = useMemo(
    () => ({ setActiveRelationshipId, setScrollToRelationshipPanel }),
    [setActiveRelationshipId, setScrollToRelationshipPanel]
  );

  return (
    <DocumentPdfActionsContext.Provider value={pdfActions}>
      <DocumentPdfStateContext.Provider value={pdfState}>
        <DocumentRelationshipNavActionsContext.Provider value={navActions}>
          <DocumentRelationshipNavStateContext.Provider value={navState}>
            <ResetPdfFillStateOnEditEnd
              resetDraftPropertySelections={resetDraftPropertySelections}
              setDocumentPdfSelection={setDocumentPdfSelection}
              setPdfSelectionMenuOpen={setPdfSelectionMenuOpen}
            />
            {children}
          </DocumentRelationshipNavStateContext.Provider>
        </DocumentRelationshipNavActionsContext.Provider>
      </DocumentPdfStateContext.Provider>
    </DocumentPdfActionsContext.Provider>
  );
};

const useDocumentPdfState = () => {
  const context = useContext(DocumentPdfStateContext);
  if (!context) throw new Error('Document PDF state context not found');
  return context;
};

const useDocumentPdfActions = () => {
  const context = useContext(DocumentPdfActionsContext);
  if (!context) throw new Error('Document PDF actions context not found');
  return context;
};

const useDocumentRelationshipNavState = () => {
  const context = useContext(DocumentRelationshipNavStateContext);
  if (!context) throw new Error('Document relationship nav state context not found');
  return context;
};

const useDocumentRelationshipNavActions = () => {
  const context = useContext(DocumentRelationshipNavActionsContext);
  if (!context) throw new Error('Document relationship nav actions context not found');
  return context;
};

const useDocumentInteraction = () => ({
  ...useDocumentPdfState(),
  ...useDocumentPdfActions(),
  ...useDocumentRelationshipNavState(),
  ...useDocumentRelationshipNavActions(),
});

const useDocumentPdf = () => ({ ...useDocumentPdfState(), ...useDocumentPdfActions() });
const useDocumentRelationshipNav = () => ({
  ...useDocumentRelationshipNavState(),
  ...useDocumentRelationshipNavActions(),
});

export {
  DocumentInteractionProvider,
  useDocumentInteraction,
  useDocumentPdf,
  useDocumentPdfActions,
  useDocumentRelationshipNav,
};
