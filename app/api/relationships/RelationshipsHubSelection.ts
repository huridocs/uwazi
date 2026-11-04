import type { ObjectIdLike, V1Relationship } from '#shared/contracts/RelationshipsV1DataSource.js';

type SearchRow = { sharedId: string; template?: { toString(): string } | null };
type IndexedRow = { position: number; template: string | undefined };
type SearchRowsIndex = Map<string, IndexedRow>;
type FilterCombination = { relationTypeId: ObjectIdLike | null; entityTemplateId: string };

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

  static indexSearchRows(rows: SearchRow[]): SearchRowsIndex {
    return new Map(
      rows.map((row, position) => [row.sharedId, { position, template: row.template?.toString() }])
    );
  }

  /** Connections to a search result whose relation type and entity template form a combination. */
  static matchingConnections(
    connections: V1Relationship[],
    rows: SearchRowsIndex,
    filterCombinations: FilterCombination[]
  ): V1Relationship[] {
    if (!filterCombinations.length) return [];

    return connections.filter(connection => {
      const row = rows.get(connection.entity);
      if (!row) return false;

      return filterCombinations.some(
        combo =>
          (combo.relationTypeId === null
            ? connection.template === null
            : connection.template?.equals(combo.relationTypeId)) &&
          combo.entityTemplateId === row.template
      );
    });
  }

  /**
   * The connections that decide which hubs are counted and returned. When filters match nothing,
   * every connection reaching a search result counts, whatever its relation type.
   */
  static candidateConnections(
    matching: V1Relationship[],
    allRightSide: V1Relationship[],
    rows: SearchRowsIndex
  ): V1Relationship[] {
    if (matching.length) return matching;
    return allRightSide.filter(connection => rows.has(connection.entity));
  }

  static countHubs(connections: V1Relationship[]): number {
    return new Set(connections.map(connection => connection.hub.toString())).size;
  }

  /** Hubs ordered by the best search position they reach, ties broken by hub id. */
  static topHubIds(candidates: V1Relationship[], rows: SearchRowsIndex, limit: number): string[] {
    const bestPositionByHub = new Map<string, number>();
    candidates.forEach(connection => {
      const hub = connection.hub.toString();
      const position = rows.get(connection.entity)?.position ?? Infinity;
      bestPositionByHub.set(hub, Math.min(bestPositionByHub.get(hub) ?? Infinity, position));
    });

    return [...bestPositionByHub.entries()]
      .sort(
        ([hubA, positionA], [hubB, positionB]) => positionA - positionB || hubA.localeCompare(hubB)
      )
      .slice(0, limit)
      .map(([hub]) => hub);
  }
}
