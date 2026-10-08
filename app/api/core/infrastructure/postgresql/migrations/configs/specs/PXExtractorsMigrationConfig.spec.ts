import { ObjectId } from 'mongodb';
import { PXExtractorsMigrationConfig } from '../PXExtractorsMigrationConfig.js';

describe('PXExtractorsMigrationConfig', () => {
  it('should map mongo px_extractors docs to px_extractors rows', () => {
    const ids = {
      _id: new ObjectId(),
      sourceTemplateId: new ObjectId(),
      targetTemplateId: new ObjectId(),
      paragraphNumberPropertyId: new ObjectId(),
      paragraphPropertyId: new ObjectId(),
      sourceRelationshipTypeId: new ObjectId(),
      targetRelationshipTypeId: new ObjectId(),
    };

    const mapped = PXExtractorsMigrationConfig.mapDocument(ids);

    expect(PXExtractorsMigrationConfig.mongoCollection).toBe('px_extractors');
    expect(PXExtractorsMigrationConfig.pgTable).toBe('px_extractors');
    expect(mapped).toEqual({
      _id: ids._id.toHexString(),
      sourceTemplateId: ids.sourceTemplateId.toHexString(),
      targetTemplateId: ids.targetTemplateId.toHexString(),
      paragraphNumberPropertyId: ids.paragraphNumberPropertyId.toHexString(),
      paragraphPropertyId: ids.paragraphPropertyId.toHexString(),
      sourceRelationshipTypeId: ids.sourceRelationshipTypeId.toHexString(),
      targetRelationshipTypeId: ids.targetRelationshipTypeId.toHexString(),
    });
  });
});
