import type { Entity as EntityType, FileType } from '#V2/api/entities/types.js';
import { useDocumentPdf } from '#V2/Routes/Entity/Components/context/index.js';
import { useDocumentPdfPage } from './useDocumentPdfPage.js';
import { useDocumentPdfRelationshipHandlers } from './useDocumentPdfRelationshipHandlers.js';
import { useDocumentPdfTextHandlers } from './useDocumentPdfTextHandlers.js';

type UseDocumentPdfViewParams = {
  mainDocument: FileType;
  entity?: EntityType;
};

function useDocumentPdfView({ mainDocument, entity }: UseDocumentPdfViewParams) {
  const { pdfController: mainPdfController, setPdfController } = useDocumentPdf();
  const page = useDocumentPdfPage({ mainDocument, mainPdfController, setPdfController });
  const textHandlers = useDocumentPdfTextHandlers();
  const relationshipHandlers = useDocumentPdfRelationshipHandlers({ entity, mainPdfController });

  return {
    ...page,
    ...textHandlers,
    ...relationshipHandlers,
    mainDocument,
    entity,
  };
}

export { useDocumentPdfView };
