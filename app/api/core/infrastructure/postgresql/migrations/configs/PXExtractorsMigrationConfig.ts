import { MigrationConfig } from '../MigrateCollectionToPostgres.js';

export const PXExtractorsMigrationConfig: MigrationConfig = {
  mongoCollection: 'px_extractors',
  pgTable: 'px_extractors',
  mapDocument(doc: Record<string, unknown>) {
    return {
      _id: String(doc._id),
      sourceTemplateId: String(doc.sourceTemplateId),
      targetTemplateId: String(doc.targetTemplateId),
      paragraphNumberPropertyId: String(doc.paragraphNumberPropertyId),
      paragraphPropertyId: String(doc.paragraphPropertyId),
      sourceRelationshipTypeId: String(doc.sourceRelationshipTypeId),
      targetRelationshipTypeId: String(doc.targetRelationshipTypeId),
    };
  },
};
