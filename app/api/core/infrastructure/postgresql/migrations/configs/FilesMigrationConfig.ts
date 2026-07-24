import { ObjectId } from 'mongodb';
import { MigrationConfig } from '../MigrateCollectionToPostgres.js';
import { FilesRow } from '../../files/PostgresFilesRow.js';
import { FileDBO } from '#api/core/infrastructure/mongodb/files/schemas/FilesTypes.js';
import { PropertySelectionSchema } from '#shared/types/commonTypes.js';
import type { TableOfContent } from '#api/core/domain/files/domainTypes.js';

/**
 * Strip control characters that are meaningless in extracted text and/or
 * rejected by PostgreSQL JSONB (U+0000). Covers C0 controls (except normal
 * whitespace: tab, line feed, carriage return), C1 controls, and corruption
 * artifacts (U+FFFD replacement character). Arabic text, bidirectional marks,
 * and all legitimate characters are preserved.
 */
/* eslint-disable no-control-regex */
export function sanitizeForJsonb(value: unknown): unknown {
  if (typeof value === 'string') {
    return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u0080-\u009F\uFFFD]/g, '');
  }
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      result[k] = sanitizeForJsonb(v);
    }
    return result;
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeForJsonb);
  }
  return value;
}

export const FilesMigrationConfig: MigrationConfig = {
  mongoCollection: 'files',
  pgTable: 'files',
  mapDocument(doc: FileDBO): FilesRow {
    const _id = doc._id instanceof ObjectId ? doc._id.toHexString() : String(doc._id);

    return {
      _id,
      creationDate: doc.creationDate,
      filename: doc.filename,
      mimetype: doc.mimetype,
      originalname: doc.originalname,
      size: doc.size,
      type: doc.type,

      entity: doc.entity || null,
      status: doc.status || null,
      language: doc.language || null,
      totalPages: doc.totalPages ?? null,
      generatedToc: doc.generatedToc ?? null,
      fullText: sanitizeForJsonb(doc.fullText) as Record<string, string> | null,
      propertySelections: sanitizeForJsonb(doc.propertySelections) as
        PropertySelectionSchema[] | null,
      toc: sanitizeForJsonb(doc.toc) as TableOfContent[] | null,

      url: doc.url || null,
    };
  },
};
