import entities from '#api/entities/entities.js';
import type { V1Relationship } from '#shared/contracts/RelationshipsV1DataSource.js';

/**
 * The connected entities that grouping connections by relation type and template needs:
 * template and published state for every entity, and documents only for the entities reached
 * through a text reference, whose language is checked against the requested one.
 */
export class ConnectedEntitiesForGrouping {
  static async load(
    connections: V1Relationship[],
    language: string
  ): Promise<Record<string, unknown>> {
    const sharedIds = [...new Set(connections.map(connection => connection.entity))];
    const withTextReferences = [
      ...new Set(
        connections.filter(connection => connection.filename).map(connection => connection.entity)
      ),
    ];

    const [connected, withDocuments] = await Promise.all([
      entities.get(
        { sharedId: { $in: sharedIds }, language },
        ['template', 'sharedId', 'published'],
        { withoutDocuments: true }
      ),
      withTextReferences.length
        ? entities.get({ sharedId: { $in: withTextReferences }, language }, ['sharedId'])
        : Promise.resolve([]),
    ]);

    const documentsBySharedId = new Map(
      withDocuments.map(entity => [entity.sharedId, entity.documents])
    );

    return Object.fromEntries(
      connected.map(entity => [
        entity.sharedId,
        documentsBySharedId.has(entity.sharedId)
          ? { ...entity, documents: documentsBySharedId.get(entity.sharedId) }
          : entity,
      ])
    );
  }
}
