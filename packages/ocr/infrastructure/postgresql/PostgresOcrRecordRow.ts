/** An `ocr_records` row. Null columns are absent: `PostgresTable` strips them on read. */
type PostgresOcrRecordRow = {
  _id: string;
  source_file_id?: string;
  result_file_id?: string;
  filename: string;
  language: string;
  status: string;
  attempt: number;
  /** BIGINT, which `pg` returns as a string. */
  requested_at?: number | string;
  /** BIGINT, which `pg` returns as a string. */
  last_updated: number | string;
  failure_reason?: string;
};

export type { PostgresOcrRecordRow };
