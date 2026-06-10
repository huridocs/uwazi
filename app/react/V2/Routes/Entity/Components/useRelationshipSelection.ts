import { useCallback } from 'react';
import { useAtom, useAtomValue } from 'jotai';
import { templatesAtom } from '#V2/atoms/index.js';
import { relationshipToHighlight } from '#V2/Components/PDFViewer/index.js';
import { RelationshipMarker } from '#V2/Components/Relationships/types.js';
import { activeRelationshipIdAtom, pdfController, scrollToRelationshipPanelAtom } from './atoms.js';

type SelectOptions = {
  scrollPanel?: boolean;
};

const useRelationshipSelection = () => {
  const [activeRelationshipId, setActiveRelationshipId] = useAtom(activeRelationshipIdAtom);
  const [, setScrollToRelationshipPanel] = useAtom(scrollToRelationshipPanelAtom);
  const mainPdfController = useAtomValue(pdfController);
  const templates = useAtomValue(templatesAtom);

  const colorOf = useCallback(
    (marker: RelationshipMarker) =>
      templates.find(template => template._id === marker.target.templateId)?.color || '#A4CAFE',
    [templates]
  );

  const selectRelationship = useCallback(
    (marker: RelationshipMarker, options?: SelectOptions) => {
      if (marker._id === activeRelationshipId) {
        setActiveRelationshipId(null);
        mainPdfController?.toggleHighlights([]);
        return;
      }

      setActiveRelationshipId(marker._id);
      if (options?.scrollPanel) {
        setScrollToRelationshipPanel(marker._id);
      }

      const page = marker.anchor?.selections?.[0]?.page;
      const highlight = relationshipToHighlight(marker.anchor, colorOf(marker), marker._id);
      if (page) {
        mainPdfController?.goToPage(page);
      }
      if (highlight) {
        mainPdfController?.toggleHighlights([highlight]);
      } else {
        mainPdfController?.toggleHighlights([]);
      }
    },
    [
      activeRelationshipId,
      colorOf,
      mainPdfController,
      setActiveRelationshipId,
      setScrollToRelationshipPanel,
    ]
  );

  const clearRelationshipSelection = useCallback(() => {
    setActiveRelationshipId(null);
    mainPdfController?.toggleHighlights([]);
  }, [mainPdfController, setActiveRelationshipId]);

  return { activeRelationshipId, selectRelationship, clearRelationshipSelection };
};

export { useRelationshipSelection };
