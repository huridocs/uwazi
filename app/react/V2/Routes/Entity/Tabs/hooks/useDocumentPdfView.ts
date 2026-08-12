import { useMemo } from 'react';
import type { Entity as EntityType, FileType } from '#V2/api/entities/types.js';
import {
  buildPendingPdfSelectionHighlights,
  buildPropertySelectionHighlights,
  mergeHighlightMaps,
  mergePropertySelections,
} from '#V2/Components/Metadata/EntityEditor/functions/propertySelectionHelpers.js';
import {
  useDocumentPdf,
  useEntityLanguage,
  useMetadataEditing,
} from '#V2/Routes/Entity/Components/context/index.js';
import { useDocumentPdfPage } from './useDocumentPdfPage.js';
import { useDocumentPdfRelationshipHandlers } from './useDocumentPdfRelationshipHandlers.js';
import { useDocumentPdfTextHandlers } from './useDocumentPdfTextHandlers.js';

type UseDocumentPdfViewParams = {
  mainDocument: FileType;
  entity?: EntityType;
};

function useDocumentPdfView({ mainDocument, entity }: UseDocumentPdfViewParams) {
  const { pdfController: mainPdfController, setPdfController, draftPropertySelections, documentPdfSelection } =
    useDocumentPdf();
  const { isEditing } = useMetadataEditing();
  const { mainDocument: languageMainDocument } = useEntityLanguage();
  const page = useDocumentPdfPage({ mainDocument, mainPdfController, setPdfController });
  const textHandlers = useDocumentPdfTextHandlers();
  const relationshipHandlers = useDocumentPdfRelationshipHandlers({ entity, mainPdfController });

  const propertySelectionHighlights = useMemo(() => {
    if (!isEditing) return undefined;
    const merged = mergePropertySelections(
      languageMainDocument?.propertySelections,
      draftPropertySelections
    );
    return mergeHighlightMaps(
      merged.length ? buildPropertySelectionHighlights(merged) : undefined,
      buildPendingPdfSelectionHighlights(documentPdfSelection)
    );
  }, [
    documentPdfSelection,
    draftPropertySelections,
    isEditing,
    languageMainDocument?.propertySelections,
  ]);

  return {
    ...page,
    ...textHandlers,
    ...relationshipHandlers,
    propertySelectionHighlights,
    mainDocument,
    entity,
  };
}

export { useDocumentPdfView };
