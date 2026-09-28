import type { DownloadFileSegmentationResponse } from '#shared/contracts/Segmentation.js';
import { Segmentation } from '../../domain/Segmentation.js';
import { SegmentTypeNames } from '../SegmentTypeNames.js';

class SegmentationWireMapper {
  static toWire(segmentation: Segmentation): DownloadFileSegmentationResponse {
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
        type: SegmentTypeNames.toName(segment.type),
      })),
    };
  }
}

export { SegmentationWireMapper };
