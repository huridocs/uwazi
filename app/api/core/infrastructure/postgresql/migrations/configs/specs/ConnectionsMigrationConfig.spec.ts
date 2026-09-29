import { ObjectId } from 'mongodb';
import { ConnectionsMigrationConfig } from '../ConnectionsMigrationConfig.js';

describe('ConnectionsMigrationConfig', () => {
  it('should map mongo connections docs to connections rows', () => {
    const id = new ObjectId();
    const hub = new ObjectId();
    const template = new ObjectId();
    const sharedId = new ObjectId();

    const mapped = ConnectionsMigrationConfig.mapDocument({
      _id: id,
      entity: 'entity1',
      hub,
      template,
      metadata: { some: 'metadata' },
      reference: { text: 'text', selectionRectangles: [] },
      sharedId,
      filename: 'file.pdf',
      range: { start: 0, end: 1 },
    });

    expect(ConnectionsMigrationConfig.mongoCollection).toBe('connections');
    expect(ConnectionsMigrationConfig.pgTable).toBe('connections');
    expect(mapped).toEqual({
      _id: id.toHexString(),
      entity: 'entity1',
      hub: hub.toHexString(),
      template: template.toHexString(),
      file: null,
      metadata: { some: 'metadata' },
      reference: { text: 'text', selectionRectangles: [] },
      sharedId: sharedId.toHexString(),
      filename: 'file.pdf',
      range: { start: 0, end: 1 },
    });
  });

  it('should handle missing optional fields', () => {
    const id = new ObjectId();
    const mapped = ConnectionsMigrationConfig.mapDocument({ _id: id, entity: 'entity1', hub: id });

    expect(mapped.template).toBeNull();
    expect(mapped.file).toBeNull();
    expect(mapped.reference).toBeNull();
    expect(mapped.sharedId).toBeNull();
    expect(mapped.filename).toBeNull();
    expect(mapped.range).toBeNull();
    expect(mapped.metadata).toEqual({});
  });

  it('should json-encode primitive legacy range values for the JSONB column', () => {
    const mapped = ConnectionsMigrationConfig.mapDocument({
      _id: new ObjectId(),
      entity: 'entity1',
      hub: new ObjectId(),
      range: 'range1',
    });

    expect(mapped.range).toBe('"range1"');
  });
});
