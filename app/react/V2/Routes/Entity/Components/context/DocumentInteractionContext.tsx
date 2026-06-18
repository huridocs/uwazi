import React, { createContext, useContext, useMemo, useState } from 'react';
import type { TextSelection } from '@huridocs/react-text-selection-handler';
import type { PDFControls } from '#V2/Components/PDFViewer/index.js';

type DocumentPdfState = {
  pdfController: PDFControls | null;
  documentPdfSelection: TextSelection | undefined;
};

type DocumentPdfActions = {
  setPdfController: React.Dispatch<React.SetStateAction<PDFControls | null>>;
  setDocumentPdfSelection: React.Dispatch<React.SetStateAction<TextSelection | undefined>>;
};

type DocumentRelationshipNavState = {
  activeRelationshipId: string | null;
  scrollToRelationshipPanel: string | null;
};

type DocumentRelationshipNavActions = {
  setActiveRelationshipId: React.Dispatch<React.SetStateAction<string | null>>;
  setScrollToRelationshipPanel: React.Dispatch<React.SetStateAction<string | null>>;
};

type SearchHintsState = { searchHintsModalOpen: boolean };
type SearchHintsActions = {
  setSearchHintsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

const DocumentPdfStateContext = createContext<DocumentPdfState | null>(null);
const DocumentPdfActionsContext = createContext<DocumentPdfActions | null>(null);
const DocumentRelationshipNavStateContext = createContext<DocumentRelationshipNavState | null>(
  null
);
const DocumentRelationshipNavActionsContext = createContext<DocumentRelationshipNavActions | null>(
  null
);
const SearchHintsStateContext = createContext<SearchHintsState | null>(null);
const SearchHintsActionsContext = createContext<SearchHintsActions | null>(null);

const DocumentInteractionProvider = ({ children }: { children: React.ReactNode }) => {
  const [pdfController, setPdfController] = useState<PDFControls | null>(null);
  const [documentPdfSelection, setDocumentPdfSelection] = useState<TextSelection>();
  const [activeRelationshipId, setActiveRelationshipId] = useState<string | null>(null);
  const [scrollToRelationshipPanel, setScrollToRelationshipPanel] = useState<string | null>(null);
  const [searchHintsModalOpen, setSearchHintsModalOpen] = useState(false);

  const pdfState = useMemo(
    () => ({ pdfController, documentPdfSelection }),
    [pdfController, documentPdfSelection]
  );
  const pdfActions = useMemo(
    () => ({ setPdfController, setDocumentPdfSelection }),
    [setPdfController, setDocumentPdfSelection]
  );
  const navState = useMemo(
    () => ({ activeRelationshipId, scrollToRelationshipPanel }),
    [activeRelationshipId, scrollToRelationshipPanel]
  );
  const navActions = useMemo(
    () => ({ setActiveRelationshipId, setScrollToRelationshipPanel }),
    [setActiveRelationshipId, setScrollToRelationshipPanel]
  );
  const hintsState = useMemo(() => ({ searchHintsModalOpen }), [searchHintsModalOpen]);
  const hintsActions = useMemo(() => ({ setSearchHintsModalOpen }), [setSearchHintsModalOpen]);

  return (
    <DocumentPdfActionsContext.Provider value={pdfActions}>
      <DocumentPdfStateContext.Provider value={pdfState}>
        <DocumentRelationshipNavActionsContext.Provider value={navActions}>
          <DocumentRelationshipNavStateContext.Provider value={navState}>
            <SearchHintsActionsContext.Provider value={hintsActions}>
              <SearchHintsStateContext.Provider value={hintsState}>
                {children}
              </SearchHintsStateContext.Provider>
            </SearchHintsActionsContext.Provider>
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

const useSearchHintsState = () => {
  const context = useContext(SearchHintsStateContext);
  if (!context) throw new Error('Search hints state context not found');
  return context;
};

const useSearchHintsActions = () => {
  const context = useContext(SearchHintsActionsContext);
  if (!context) throw new Error('Search hints actions context not found');
  return context;
};

const useDocumentInteraction = () => ({
  ...useDocumentPdfState(),
  ...useDocumentPdfActions(),
  ...useDocumentRelationshipNavState(),
  ...useDocumentRelationshipNavActions(),
  ...useSearchHintsState(),
  ...useSearchHintsActions(),
});

const useDocumentPdf = () => ({ ...useDocumentPdfState(), ...useDocumentPdfActions() });
const useDocumentRelationshipNav = () => ({
  ...useDocumentRelationshipNavState(),
  ...useDocumentRelationshipNavActions(),
});
const useSearchHints = () => ({ ...useSearchHintsState(), ...useSearchHintsActions() });

export {
  DocumentInteractionProvider,
  useDocumentInteraction,
  useDocumentPdf,
  useDocumentPdfActions,
  useDocumentRelationshipNav,
  useSearchHints,
};
