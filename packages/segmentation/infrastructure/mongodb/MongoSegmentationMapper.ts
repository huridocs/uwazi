import { ObjectId } from 'mongodb';
import { DocumentLayout, LayoutPage } from '../../domain/DocumentLayout.js';
import { LayoutSegment } from '../../domain/LayoutSegment.js';
import { Segmentation } from '../../domain/Segmentation.js';
import { SegmentationFailureReason } from '../../domain/SegmentationFailureReason.js';
import { SegmentationStatus } from '../../domain/SegmentationStatus.js';
import { MongoParagraphDBO, MongoSegmentationDBO } from './MongoSegmentationDBO.js';
import { StoredSegmentTypes } from './StoredSegmentTypes.js';

type StoredLayout = NonNullable<MongoSegmentationDBO['segmentation']>;

class MongoSegmentationMapper {
  static toDomain(dbo: MongoSegmentationDBO): Segmentation {
    return new Segmentation({
      id: dbo._id.toHexString(),
      fileId: dbo.fileID.toHexString(),
      filename: dbo.filename,
      status: dbo.status as SegmentationStatus,
      attempt: dbo.attempt ?? 0,
      requestedAt: dbo.requestedAt,
      xmlFilename: dbo.xmlname,
      failureReason: dbo.failureReason as SegmentationFailureReason | undefined,
      layout: dbo.segmentation && MongoSegmentationMapper.layoutToDomain(dbo.segmentation),
    });
  }

  static toDBO(segmentation: Segmentation): MongoSegmentationDBO {
    return {
      _id: new ObjectId(segmentation.id),
      fileID: new ObjectId(segmentation.fileId),
      filename: segmentation.filename,
      status: segmentation.status,
      attempt: segmentation.attempt,
      ...(segmentation.requestedAt !== undefined && { requestedAt: segmentation.requestedAt }),
      ...(segmentation.xmlFilename !== undefined && { xmlname: segmentation.xmlFilename }),
      ...(segmentation.failureReason !== undefined && {
        failureReason: segmentation.failureReason,
      }),
      ...(segmentation.layout && {
        segmentation: MongoSegmentationMapper.layoutToStored(segmentation.layout),
      }),
    };
  }

  private static layoutToDomain(stored: StoredLayout): DocumentLayout {
    const paragraphs = stored.paragraphs ?? [];

    return new DocumentLayout({
      pages: MongoSegmentationMapper.pagesOf(stored, paragraphs),
      segments: paragraphs.map(
        paragraph =>
          new LayoutSegment({
            left: paragraph.left ?? 0,
            top: paragraph.top ?? 0,
            width: paragraph.width ?? 0,
            height: paragraph.height ?? 0,
            pageNumber: paragraph.page_number ?? 1,
            text: paragraph.text ?? '',
            type: StoredSegmentTypes.toDomain(paragraph.type),
          })
      ),
    });
  }

  /** A page's size is its first paragraph's, or the document-wide one records used to keep. */
  private static pagesOf(stored: StoredLayout, paragraphs: MongoParagraphDBO[]): LayoutPage[] {
    const pages = new Map<number, LayoutPage>();
    paragraphs.forEach(paragraph => {
      const number = paragraph.page_number ?? 1;
      if (!pages.has(number)) {
        pages.set(number, {
          number,
          width: paragraph.page_width ?? stored.page_width ?? 0,
          height: paragraph.page_height ?? stored.page_height ?? 0,
        });
      }
    });
    return [...pages.values()];
  }

  private static layoutToStored(layout: DocumentLayout): StoredLayout {
    const [firstPage] = layout.pages;

    return {
      page_width: firstPage?.width ?? 0,
      page_height: firstPage?.height ?? 0,
      paragraphs: layout.segments.map(segment => ({
        left: segment.left,
        top: segment.top,
        width: segment.width,
        height: segment.height,
        page_number: segment.pageNumber,
        page_width: layout.page(segment.pageNumber)!.width,
        page_height: layout.page(segment.pageNumber)!.height,
        text: segment.text,
        type: StoredSegmentTypes.toStored(segment.type),
      })),
    };
  }
}

export { MongoSegmentationMapper };
