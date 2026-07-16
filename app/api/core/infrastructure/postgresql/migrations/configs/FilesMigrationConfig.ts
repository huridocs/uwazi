import { ObjectId } from 'mongodb';
import { MigrationConfig } from '../MigrateCollectionToPostgres.js';
import { FilesRow } from '../../files/PostgresFilesRow.js';
import { FileDBO } from '#api/core/infrastructure/mongodb/files/schemas/FilesTypes.js';

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
      totalPages: doc.totalPages || null,
      fullText: doc.fullText || null,
      generatedToc: doc.generatedToc || null,
      propertySelections: doc.propertySelections || null,
      toc: doc.toc || null,

      url: doc.url || null,
    };
  },
};
