import { Segmentation } from '../../domain/Segmentation.js';
import { LegacySegmentTypeNames } from '../LegacySegmentTypeNames.js';

/**
 * The segmentation endpoint's response, as clients have always received it: one document-wide
 * page size — the first page's — segments called paragraphs under the service's type names, and
 * the fields of the old record, `documentId` and a null `autoExpire` included.
 */
type SegmentationWireContract = {
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

class SegmentationWireMapper {
  static toWire(segmentation: Segmentation): SegmentationWireContract {
    const [firstPage] = segmentation.layout?.pages ?? [];

    return {
      id: segmentation.id,
      fileId: segmentation.fileId,
      documentId: segmentation.fileId,
      status: segmentation.status,
      filename: segmentation.filename,
      ...(segmentation.xmlFilename !== undefined && { xmlname: segmentation.xmlFilename }),
      autoExpire: null,
      pageWidth: firstPage?.width ?? 0,
      pageHeight: firstPage?.height ?? 0,
      paragraphs: (segmentation.layout?.segments ?? []).map(segment => ({
        left: segment.left,
        top: segment.top,
        width: segment.width,
        height: segment.height,
        pageNumber: segment.pageNumber,
        text: segment.text,
        type: LegacySegmentTypeNames.toStored(segment.type),
      })),
    };
  }
}

export { SegmentationWireMapper };
export type { SegmentationWireContract };
