import React, { useEffect, useRef } from 'react';
import type { TextSelection } from '@huridocs/react-text-selection-handler';
import { useMetadataEditing } from './MetadataEditingContext.js';

type ResetPdfFillStateOnEditEndProps = {
  resetDraftPropertySelections: () => void;
  setDocumentPdfSelection: React.Dispatch<React.SetStateAction<TextSelection | undefined>>;
  setPdfSelectionMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  disarmPdfFill: () => void;
};

const ResetPdfFillStateOnEditEnd = ({
  resetDraftPropertySelections,
  setDocumentPdfSelection,
  setPdfSelectionMenuOpen,
  disarmPdfFill,
}: ResetPdfFillStateOnEditEndProps) => {
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

export { ResetPdfFillStateOnEditEnd };
