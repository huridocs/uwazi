import { ObjectId } from 'mongodb';
import { SegmentationReadModel, SegmentTypeNames } from '#segmentation';
import { SegmentationType } from '#shared/types/segmentationType.js';

type IXSegmentationShape = SegmentationType & {
  fileID: ObjectId;
  filename: string;
  xmlname: string;
};

/**
 * A ready segmentation in the shape information extraction has always carried and sends to the
 * extraction service: snake_case boxes named paragraphs, one document-wide page size — the first
 * page's — and the services' segment type names.
 */
class IXSegmentation {
  static fromReadModel(segmentation: SegmentationReadModel): IXSegmentationShape {
    const [firstPage] = segmentation.layout.pages;

    return {
      fileID: new ObjectId(segmentation.fileId),
      filename: segmentation.filename,
      xmlname: segmentation.xmlFilename,
      status: 'ready',
      segmentation: {
        page_width: firstPage?.width ?? 0,
        page_height: firstPage?.height ?? 0,
        paragraphs: segmentation.layout.segments.map(segment => ({
          left: segment.left,
          top: segment.top,
          width: segment.width,
          height: segment.height,
          page_number: segment.pageNumber,
          text: segment.text,
          type: SegmentTypeNames.toName(segment.type),
        })),
      },
    };
  }
}

export { IXSegmentation };
export type { IXSegmentationShape };
