import type { RelationshipTypesDataSource } from '#api/core/application/contracts/RelationshipTypesDataSource.js';
import type relationships from '#api/relationships/relationships.js';

type Deps = {
  relationshipTypesDS: RelationshipTypesDataSource;
  relationships: typeof relationships;
};

class RelationTypesQueryService {
  constructor(private deps: Deps) {}

  async countByTypes(): Promise<Record<string, number>> {
    const ids = await this.deps.relationshipTypesDS.getRelationshipTypeIds();
    const entries = await Promise.all(
      ids.map(async (id): Promise<[string, number]> => [
        id,
        await this.deps.relationships.countByRelationType(id),
      ])
    );
    return Object.fromEntries(entries);
  }

  async countByType({ relationtypeId }: { relationtypeId: string }): Promise<number> {
    return this.deps.relationships.countByRelationType(relationtypeId);
  }
}

export { RelationTypesQueryService };
