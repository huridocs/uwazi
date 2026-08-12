import { useMemo } from 'react';
import {
  useDocumentPdf,
  useEntityLanguage,
  useMetadataEditing,
} from '#V2/Routes/Entity/Components/context/index.js';
import {
  buildPropertySelectionHighlights,
  mergePropertySelections,
} from '#V2/Components/Metadata/EntityEditor/functions/propertySelectionHelpers.js';

const usePropertySelectionHighlights = () => {
  const { isEditing } = useMetadataEditing();
  const { mainDocument } = useEntityLanguage();
  const { draftPropertySelections } = useDocumentPdf();

  return useMemo(() => {
    if (!isEditing) return undefined;
    const merged = mergePropertySelections(
      mainDocument?.propertySelections,
      draftPropertySelections
    );
    if (!merged.length) return undefined;
    return buildPropertySelectionHighlights(merged);
  }, [draftPropertySelections, isEditing, mainDocument?.propertySelections]);
};

export { usePropertySelectionHighlights };
