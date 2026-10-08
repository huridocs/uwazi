import { ObjectId } from 'mongodb';
import { PXEntitiesStatusMigrationConfig } from '../PXEntitiesStatusMigrationConfig.js';

describe('PXEntitiesStatusMigrationConfig', () => {
  it('should map mongo px_entities_status docs to px_entities_status rows', () => {
    const id = new ObjectId();
    const extractorId = new ObjectId();

    const mapped = PXEntitiesStatusMigrationConfig.mapDocument({
      _id: id,
      entitySharedId: 'entity1',
      extractorId,
      status: 'processed',
    });

    expect(PXEntitiesStatusMigrationConfig.mongoCollection).toBe('px_entities_status');
    expect(PXEntitiesStatusMigrationConfig.pgTable).toBe('px_entities_status');
    expect(mapped).toEqual({
      _id: id.toHexString(),
      entitySharedId: 'entity1',
      extractorId: extractorId.toHexString(),
      status: 'processed',
    });
  });

  it('should skip statuses whose extractor no longer exists', () => {
    expect(PXEntitiesStatusMigrationConfig.excludeOrphansOf).toEqual({
      field: 'extractorId',
      collection: 'px_extractors',
    });
  });
});
