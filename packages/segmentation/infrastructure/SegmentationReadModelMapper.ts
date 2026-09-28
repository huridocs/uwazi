import { SegmentationReadModel } from '../application/contracts/SegmentationReadModels.js';
import { Segmentation } from '../domain/Segmentation.js';

class SegmentationReadModelMapper {
  /** Only for ready segmentations, which always carry a layout. */
  static toReadModel(segmentation: Segmentation): SegmentationReadModel {
    const layout = segmentation.layout!;

    return {
      fileId: segmentation.fileId,
      filename: segmentation.filename,
      xmlFilename: segmentation.xmlFilename ?? '',
      layout: {
        pages: layout.pages.map(page => ({ ...page })),
        segments: layout.segments.map(segment => ({
          left: segment.left,
          top: segment.top,
          width: segment.width,
          height: segment.height,
          pageNumber: segment.pageNumber,
          text: segment.text,
          type: segment.type,
        })),
      },
    };
  }
}

export { SegmentationReadModelMapper };
