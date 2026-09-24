import { ObjectId } from 'mongodb';
import type { HubConnection, V1Relationship } from '#shared/contracts/RelationshipsV1DataSource.js';
import type { PostgresRelationshipRow } from './PostgresRelationshipRow.js';

const isObjectId = (value: unknown): boolean =>
  typeof value === 'object' &&
  value !== null &&
  (value as { _bsontype?: string })._bsontype === 'ObjectId';

const toIdString = (value: unknown): string | null => {
  if (value === undefined || value === null) return null;
  if (isObjectId(value)) return String(value);
  if (typeof value === 'object') {
    const nested = (value as { _id?: unknown })._id;
    if (nested !== undefined) return toIdString(nested);
    return null;
  }
  return String(value);
};

const toObjectId = (value: unknown): ObjectId | null => {
  const id = toIdString(value);
  return id ? new ObjectId(id) : null;
};

export class PostgresRelationshipMapper {
  static toV1Relationship(row: PostgresRelationshipRow): V1Relationship {
    return {
      _id: new ObjectId(row._id),
      hub: new ObjectId(row.hub as string),
      entity: row.entity as string,
      template: row.template ? new ObjectId(row.template) : null,
      ...(row.file ? { file: row.file } : {}),
      ...(row.metadata ? { metadata: row.metadata } : {}),
      ...(row.reference ? { reference: row.reference } : {}),
      ...(row.sharedId ? { sharedId: new ObjectId(row.sharedId) } : {}),
      ...(row.filename ? { filename: row.filename } : {}),
      ...(row.range ? { range: row.range } : {}),
    };
  }

  static toHubConnection(row: PostgresRelationshipRow): HubConnection {
    return {
      _id: row._id,
      hub: row.hub as string,
      entity: row.entity as string,
      template: row.template ?? null,
      ...(row.file ? { file: row.file } : {}),
      ...(row.reference ? { reference: row.reference } : {}),
      ...(row.filename ? { filename: row.filename } : {}),
      ...(row.sharedId ? { sharedId: row.sharedId } : {}),
    };
  }

  static toRow(
    document: Partial<V1Relationship> & Record<string, unknown>
  ): PostgresRelationshipRow {
    return {
      _id: toIdString(document._id) ?? new ObjectId().toHexString(),
      entity: typeof document.entity === 'string' ? document.entity : null,
      hub: toIdString(document.hub),
      template: toIdString(document.template),
      file: toIdString(document.file),
      metadata: (document.metadata as Record<string, unknown>) ?? {},
      reference: (document.reference as PostgresRelationshipRow['reference']) ?? null,
      sharedId: toIdString(document.sharedId),
      filename: typeof document.filename === 'string' ? document.filename : null,
      range: document.range ?? null,
    };
  }

  static toObjectId(value: unknown): ObjectId | null {
    return toObjectId(value);
  }
}
