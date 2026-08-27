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

type ArmedPdfFill = {
  name: string;
  propertyId?: string;
  label: string;
};

type DocumentPdfState = {
  pdfController: PDFControls | null;
  documentPdfSelection: TextSelection | undefined;
  pdfSelectionMenuOpen: boolean;
  draftPropertySelections: PropertySelectionSchema[];
  armedPdfFill: ArmedPdfFill | null;
  pdfFillCommitNonce: number;
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
  armPdfFill: (target: ArmedPdfFill) => void;
  disarmPdfFill: () => void;
  requestPdfFillCommit: () => void;
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
  disarmPdfFill,
}: {
  resetDraftPropertySelections: () => void;
  setDocumentPdfSelection: React.Dispatch<React.SetStateAction<TextSelection | undefined>>;
  setPdfSelectionMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  disarmPdfFill: () => void;
}) => {
  const { isEditing } = useMetadataEditing();
  const wasEditing = useRef(false);

  useEffect(() => {
    if (wasEditing.current && !isEditing) {
      resetDraftPropertySelections();
      setDocumentPdfSelection(undefined);
      setPdfSelectionMenuOpen(false);
      disarmPdfFill();
    }
    wasEditing.current = isEditing;
  }, [
    isEditing,
    resetDraftPropertySelections,
    setDocumentPdfSelection,
    setPdfSelectionMenuOpen,
    disarmPdfFill,
  ]);

  return null;
};

const DocumentInteractionProvider = ({ children }: { children: React.ReactNode }) => {
  const [pdfController, setPdfController] = useState<PDFControls | null>(null);
  const [documentPdfSelection, setDocumentPdfSelection] = useState<TextSelection>();
  const [pdfSelectionMenuOpen, setPdfSelectionMenuOpen] = useState(false);
  const [draftPropertySelections, setDraftPropertySelections] = useState<PropertySelectionSchema[]>(
    []
  );
  const [armedPdfFill, setArmedPdfFill] = useState<ArmedPdfFill | null>(null);
  const [pdfFillCommitNonce, setPdfFillCommitNonce] = useState(0);
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

  const armPdfFill = useCallback((target: ArmedPdfFill) => {
    setArmedPdfFill(target);
  }, []);

  const disarmPdfFill = useCallback(() => {
    setArmedPdfFill(null);
  }, []);

  const requestPdfFillCommit = useCallback(() => {
    setPdfFillCommitNonce(n => n + 1);
  }, []);

  useEffect(() => {
    if (!armedPdfFill) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      const { target } = event;
      if (target instanceof Element && target.closest('[role=dialog]')) return;
      disarmPdfFill();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [armedPdfFill, disarmPdfFill]);

  const pdfState = useMemo(
    () => ({
      pdfController,
      documentPdfSelection,
      pdfSelectionMenuOpen,
      draftPropertySelections,
      armedPdfFill,
      pdfFillCommitNonce,
    }),
    [
      pdfController,
      documentPdfSelection,
      pdfSelectionMenuOpen,
      draftPropertySelections,
      armedPdfFill,
      pdfFillCommitNonce,
    ]
  );
  const pdfActions = useMemo(
    () => ({
      setPdfController,
      setDocumentPdfSelection,
      setPdfSelectionMenuOpen,
      upsertPropertySelection,
      clearPropertySelection,
      resetDraftPropertySelections,
      armPdfFill,
      disarmPdfFill,
      requestPdfFillCommit,
    }),
    [
      upsertPropertySelection,
      clearPropertySelection,
      resetDraftPropertySelections,
      armPdfFill,
      disarmPdfFill,
      requestPdfFillCommit,
    ]
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
              disarmPdfFill={disarmPdfFill}
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
