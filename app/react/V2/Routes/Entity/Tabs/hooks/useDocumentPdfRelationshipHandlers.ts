import type { PDFControls } from '#V2/Components/PDFViewer/index.js';
import type { Entity as EntityType } from '#V2/api/entities/types.js';
import { useActiveRelationshipHighlight } from '#V2/Routes/Entity/Components/document/index.js';
import { useDocumentPdfClusterHighlight } from './useDocumentPdfClusterHighlight.js';
import { useDocumentPdfRelationshipClicks } from './useDocumentPdfRelationshipClicks.js';

type UseDocumentPdfRelationshipHandlersParams = {
  entity?: EntityType;
  mainPdfController: PDFControls | null | undefined;
};

function useDocumentPdfRelationshipHandlers({
  entity,
  mainPdfController,
}: UseDocumentPdfRelationshipHandlersParams) {
  const { activeRelationshipId, selectRelationship, clearRelationshipSelection } =
    useActiveRelationshipHighlight();
  const { activeClusterRefIds, setActiveClusterRefIds, findMarkerById } =
    useDocumentPdfClusterHighlight({ entity, mainPdfController });
  const { handleRailPointClick, handleClusterClick, handleClusterMoreClick, handleHighlightClick } =
    useDocumentPdfRelationshipClicks({
      entity,
      mainPdfController,
      activeClusterRefIds,
      setActiveClusterRefIds,
      findMarkerById,
      selectRelationship,
      clearRelationshipSelection,
    });

  return {
    activeRelationshipId,
    handleRailPointClick,
    handleClusterClick,
    handleClusterMoreClick,
    handleHighlightClick,
  };
}

export { useDocumentPdfRelationshipHandlers };
