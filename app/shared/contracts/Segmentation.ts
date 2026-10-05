/** GET /api/v2/files/:id/segmentation */
type DownloadFileSegmentationRequest = { id: string };

/**
 * The finished segmentation of a document, as clients have always received it: one document-wide
 * page size — the first page's — segments called paragraphs under the ML services' type names,
 * and the fields of the old record, `documentId` and a null `autoExpire` included.
 */
type DownloadFileSegmentationResponse = {
  id: string;
  fileId: string;
  documentId: string;
  status: string;
  filename: string;
  xmlname?: string;
  autoExpire: null;
  pageWidth: number;
  pageHeight: number;
  paragraphs: {
    left: number;
    top: number;
    width: number;
    height: number;
    pageNumber: number;
    text: string;
    type: string;
  }[];
};

export type { DownloadFileSegmentationRequest, DownloadFileSegmentationResponse };
