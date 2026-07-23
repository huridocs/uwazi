import { ObjectId } from 'mongodb';
import { MigrationConfig } from '../MigrateCollectionToPostgres.js';
import { FilesRow } from '../../files/PostgresFilesRow.js';
import { FileDBO } from '#api/core/infrastructure/mongodb/files/schemas/FilesTypes.js';
import { PropertySelectionSchema } from '#shared/types/commonTypes.js';

/**
 * Remove C0 control characters that PostgreSQL JSONB rejects or that are
 * meaningless PDF extraction artifacts (null bytes, backspace, group separators,
 * etc.). Normal whitespace (tab, line feed, carriage return) is preserved.
 */
/* eslint-disable no-control-regex */
function sanitizeForJsonb(value: unknown): unknown {
  if (typeof value === 'string') {
    return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
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
      toc: doc.toc || null,

      url: doc.url || null,
    };
  },
};
