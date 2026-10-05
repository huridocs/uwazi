type StoredLayout = {
  pages: { number: number; width: number; height: number }[];
  segments: {
    left: number;
    top: number;
    width: number;
    height: number;
    pageNumber: number;
    text: string;
    type: string;
  }[];
};

/** A `segmentations` row. Null columns are absent: `PostgresTable` strips them on read. */
type PostgresSegmentationRow = {
  _id: string;
  file_id: string;
  filename: string;
  status: string;
  attempt: number;
  /** BIGINT, which `pg` returns as a string. */
  requested_at?: number | string;
  xml_filename?: string;
  failure_reason?: string;
  layout?: StoredLayout;
};

export type { PostgresSegmentationRow, StoredLayout };
