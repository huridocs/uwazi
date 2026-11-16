import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { TextSelection } from '@huridocs/react-text-selection-handler';
import type { PropertySelectionSchema } from '#shared/types/commonTypes.js';
import type { PDFControls } from '#V2/Components/PDFViewer/index.js';
import {
  clearDraftSelection,
  upsertDraftSelection,
} from '#V2/Components/Metadata/EntityEditor/functions/propertySelectionHelpers.js';
import { ResetPdfFillStateOnEditEnd } from './ResetPdfFillStateOnEditEnd.js';
import {
  DocumentHighlightGateContext,
  useDocumentHighlightGate,
} from '../document/documentHighlightGate.js';

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

const usePdfInteractionState = () => {
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
  return {
    pdfController,
    setPdfController,
    documentPdfSelection,
    setDocumentPdfSelection,
    pdfSelectionMenuOpen,
    setPdfSelectionMenuOpen,
    draftPropertySelections,
    setDraftPropertySelections,
    armedPdfFill,
    setArmedPdfFill,
    pdfFillCommitNonce,
    setPdfFillCommitNonce,
    activeRelationshipId,
    setActiveRelationshipId,
    scrollToRelationshipPanel,
    setScrollToRelationshipPanel,
  };
};

const usePdfDraftActions = (
  setDraftPropertySelections: React.Dispatch<React.SetStateAction<PropertySelectionSchema[]>>,
  setArmedPdfFill: React.Dispatch<React.SetStateAction<ArmedPdfFill | null>>,
  setPdfFillCommitNonce: React.Dispatch<React.SetStateAction<number>>
) => {
  const resetDraftPropertySelections = useCallback(() => {
    setDraftPropertySelections([]);
  }, [setDraftPropertySelections]);
  const upsertPropertySelection = useCallback(
    (property: { name: string; id?: string }, selection: TextSelection) => {
      setDraftPropertySelections(prev => upsertDraftSelection(prev, property, selection));
    },
    [setDraftPropertySelections]
  );
  const clearPropertySelection = useCallback(
    (property: { name: string; id?: string }) => {
      setDraftPropertySelections(prev => clearDraftSelection(prev, property));
    },
    [setDraftPropertySelections]
  );
  const armPdfFill = useCallback(
    (target: ArmedPdfFill) => {
      setArmedPdfFill(prev =>
        prev?.name === target.name && prev.propertyId === target.propertyId ? prev : target
      );
    },
    [setArmedPdfFill]
  );
  const disarmPdfFill = useCallback(() => {
    setArmedPdfFill(null);
  }, [setArmedPdfFill]);
  const requestPdfFillCommit = useCallback(() => {
    setPdfFillCommitNonce(n => n + 1);
  }, [setPdfFillCommitNonce]);
  return {
    resetDraftPropertySelections,
    upsertPropertySelection,
    clearPropertySelection,
    armPdfFill,
    disarmPdfFill,
    requestPdfFillCommit,
  };
};

const useDisarmPdfFillOnEscape = (armedPdfFill: ArmedPdfFill | null, disarmPdfFill: () => void) => {
  const pdfFillArmed = armedPdfFill !== null;
  useEffect(() => {
    if (!pdfFillArmed) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      const { target } = event;
      if (target instanceof Element && target.closest('[role=dialog]')) return;
      disarmPdfFill();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [pdfFillArmed, disarmPdfFill]);
};

const usePdfContextValues = (
  state: ReturnType<typeof usePdfInteractionState>,
  actions: ReturnType<typeof usePdfDraftActions>
) => {
  const pdfState = useMemo(
    () => ({
      pdfController: state.pdfController,
      documentPdfSelection: state.documentPdfSelection,
      pdfSelectionMenuOpen: state.pdfSelectionMenuOpen,
      draftPropertySelections: state.draftPropertySelections,
      armedPdfFill: state.armedPdfFill,
      pdfFillCommitNonce: state.pdfFillCommitNonce,
    }),
    [
      state.armedPdfFill,
      state.documentPdfSelection,
      state.draftPropertySelections,
      state.pdfController,
      state.pdfFillCommitNonce,
      state.pdfSelectionMenuOpen,
    ]
  );
  const pdfActions = useMemo(
    () => ({
      setPdfController: state.setPdfController,
      setDocumentPdfSelection: state.setDocumentPdfSelection,
      setPdfSelectionMenuOpen: state.setPdfSelectionMenuOpen,
      upsertPropertySelection: actions.upsertPropertySelection,
      clearPropertySelection: actions.clearPropertySelection,
      resetDraftPropertySelections: actions.resetDraftPropertySelections,
      armPdfFill: actions.armPdfFill,
      disarmPdfFill: actions.disarmPdfFill,
      requestPdfFillCommit: actions.requestPdfFillCommit,
    }),
    [
      actions.armPdfFill,
      actions.clearPropertySelection,
      actions.disarmPdfFill,
      actions.requestPdfFillCommit,
      actions.resetDraftPropertySelections,
      actions.upsertPropertySelection,
      state.setDocumentPdfSelection,
      state.setPdfController,
      state.setPdfSelectionMenuOpen,
    ]
  );
  const navState = useMemo(
    () => ({
      activeRelationshipId: state.activeRelationshipId,
      scrollToRelationshipPanel: state.scrollToRelationshipPanel,
    }),
    [state.activeRelationshipId, state.scrollToRelationshipPanel]
  );
  const navActions = useMemo(
    () => ({
      setActiveRelationshipId: state.setActiveRelationshipId,
      setScrollToRelationshipPanel: state.setScrollToRelationshipPanel,
    }),
    [state.setActiveRelationshipId, state.setScrollToRelationshipPanel]
  );
  return { pdfState, pdfActions, navState, navActions };
};

const DocumentInteractionProvider = ({ children }: { children: React.ReactNode }) => {
  const highlightGate = useDocumentHighlightGate();
  const state = usePdfInteractionState();
  const actions = usePdfDraftActions(
    state.setDraftPropertySelections,
    state.setArmedPdfFill,
    state.setPdfFillCommitNonce
  );
  useDisarmPdfFillOnEscape(state.armedPdfFill, actions.disarmPdfFill);
  const { pdfState, pdfActions, navState, navActions } = usePdfContextValues(state, actions);

  return (
    <DocumentHighlightGateContext.Provider value={highlightGate}>
      <DocumentPdfActionsContext.Provider value={pdfActions}>
        <DocumentPdfStateContext.Provider value={pdfState}>
          <DocumentRelationshipNavActionsContext.Provider value={navActions}>
            <DocumentRelationshipNavStateContext.Provider value={navState}>
              <ResetPdfFillStateOnEditEnd
                resetDraftPropertySelections={actions.resetDraftPropertySelections}
                setDocumentPdfSelection={state.setDocumentPdfSelection}
                setPdfSelectionMenuOpen={state.setPdfSelectionMenuOpen}
                disarmPdfFill={actions.disarmPdfFill}
              />
              {children}
            </DocumentRelationshipNavStateContext.Provider>
          </DocumentRelationshipNavActionsContext.Provider>
        </DocumentPdfStateContext.Provider>
      </DocumentPdfActionsContext.Provider>
    </DocumentHighlightGateContext.Provider>
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
