import type { ObjectIdLike, V1Relationship } from '#shared/contracts/RelationshipsV1DataSource.js';

export class RelationshipsHubSelection {
  /**
   * Same semantics as the data sources' relation type filter: an empty filter keeps everything,
   * a `null` entry matches connections without relation type.
   */
  static byRelationType(
    connections: V1Relationship[],
    relationTypeFilter: (ObjectIdLike | null)[]
  ): V1Relationship[] {
    if (!relationTypeFilter.length) return connections;

    const includesNull = relationTypeFilter.includes(null);
    const relationTypes = new Set(
      relationTypeFilter.filter(type => type !== null).map(type => type.toString())
    );

    return connections.filter(connection =>
      connection.template === null
        ? includesNull
        : relationTypes.has(connection.template.toString())
    );
  }
}
