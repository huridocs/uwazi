import { OcrRecord } from '../../domain/OcrRecord.js';

interface OcrRecordDataSource {
  /** Stores a new record; returns false, storing nothing, when its source file already has one. */
  create(record: OcrRecord): Promise<boolean>;

  getById(id: string): Promise<OcrRecord | undefined>;

  getBySourceFileId(fileId: string): Promise<OcrRecord | undefined>;

  /** The file name the OCR service knows; only records that still have a source file. */
  getByFilename(filename: string): Promise<OcrRecord | undefined>;

  /** Updates a stored record. One deleted in the meantime stays deleted. */
  save(record: OcrRecord): Promise<void>;

  /** The records whose source or result file is one of the files. */
  getForFiles(fileIds: string[]): Promise<OcrRecord[]>;

  delete(ids: string[]): Promise<void>;
}

export type { OcrRecordDataSource };
