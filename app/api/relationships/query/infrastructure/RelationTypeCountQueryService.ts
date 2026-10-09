import type { GetRelationshipTypesUseCase } from '#api/core/application/GetRelationshipTypes.js';

type RelationshipCounter = {
  countByRelationType(typeId: string): Promise<number>;
};

type Deps = {
  getRelationshipTypes: GetRelationshipTypesUseCase;
  relationships: RelationshipCounter;
};

type CountOneByRelationTypeInput = {
  relationtypeId: string;
};

type RelationTypeCountQuery = {
  all(): Promise<Record<string, number>>;
  one(input: CountOneByRelationTypeInput): Promise<number>;
};

class RelationTypeCountQueryService implements RelationTypeCountQuery {
  constructor(private deps: Deps) {}

  async all(): Promise<Record<string, number>> {
    const types = await this.deps.getRelationshipTypes.execute({});
    const entries = await Promise.all(
      types.map(async (type): Promise<[string, number]> => [
        type.id,
        await this.deps.relationships.countByRelationType(type.id),
      ])
    );
    return Object.fromEntries(entries);
  }

  async one({ relationtypeId }: CountOneByRelationTypeInput): Promise<number> {
    return this.deps.relationships.countByRelationType(relationtypeId);
  }
}

export { RelationTypeCountQueryService };
export type { RelationTypeCountQuery };
