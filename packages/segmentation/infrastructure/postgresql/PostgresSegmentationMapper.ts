import { DocumentLayout } from '../../domain/DocumentLayout.js';
import { LayoutSegment } from '../../domain/LayoutSegment.js';
import { Segmentation } from '../../domain/Segmentation.js';
import { SegmentationFailureReason } from '../../domain/SegmentationFailureReason.js';
import { SegmentationStatus } from '../../domain/SegmentationStatus.js';
import { SegmentType } from '../../domain/SegmentType.js';
import { PostgresSegmentationRow, StoredLayout } from './PostgresSegmentationRow.js';

class PostgresSegmentationMapper {
  static toDomain(row: PostgresSegmentationRow): Segmentation {
    return new Segmentation({
      id: row._id,
      fileId: row.file_id,
      filename: row.filename,
      status: row.status as SegmentationStatus,
      attempt: Number(row.attempt),
      requestedAt: row.requested_at === undefined ? undefined : Number(row.requested_at),
      xmlFilename: row.xml_filename,
      failureReason: row.failure_reason as SegmentationFailureReason | undefined,
      layout: row.layout && PostgresSegmentationMapper.layoutToDomain(row.layout),
    });
  }

  /** Every column, with null for what the segmentation lacks, so an update clears it too. */
  static toRow(segmentation: Segmentation): Record<string, unknown> {
    return {
      _id: segmentation.id,
      file_id: segmentation.fileId,
      filename: segmentation.filename,
      status: segmentation.status,
      attempt: segmentation.attempt,
      requested_at: segmentation.requestedAt ?? null,
      xml_filename: segmentation.xmlFilename ?? null,
      failure_reason: segmentation.failureReason ?? null,
      layout: segmentation.layout
        ? PostgresSegmentationMapper.layoutToStored(segmentation.layout)
        : null,
    };
  }

  private static layoutToDomain(stored: StoredLayout): DocumentLayout {
    return new DocumentLayout({
      pages: stored.pages,
      segments: stored.segments.map(
        segment => new LayoutSegment({ ...segment, type: segment.type as SegmentType })
      ),
    });
  }

  private static layoutToStored(layout: DocumentLayout): StoredLayout {
    return {
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
    };
  }
}

export { PostgresSegmentationMapper };
