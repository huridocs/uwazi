import type {
  RelationshipType,
  RelationshipTypeInput,
} from '#shared/contracts/RelationshipType.js';
import type { ApiResponse } from '#V2/api/ApiResponse.js';
import type { ServiceRequestOptions } from '#V2/services/contracts/ServiceRequestOptions.js';
import type { RelationshipTypesService } from '#V2/services/contracts/RelationshipTypesService.js';

type TestingRelationshipTypesServiceOptions = {
  initialRelationshipTypes?: RelationshipType[];
};

type TestingRelationshipTypesService = RelationshipTypesService & {
  seed(types: RelationshipType[]): void;
  snapshot(): RelationshipType[];
};

const cloneTypes = (types: RelationshipType[]): RelationshipType[] =>
  types.map(type => ({ ...type }));

const createTestingRelationshipTypesService = ({
  initialRelationshipTypes = [],
}: TestingRelationshipTypesServiceOptions = {}): TestingRelationshipTypesService => {
  let relationshipTypes = cloneTypes(initialRelationshipTypes);
  let nextId = 1;

  const service: TestingRelationshipTypesService = {
    getAll: async (_options?: ServiceRequestOptions): Promise<ApiResponse<RelationshipType[]>> => [
      cloneTypes(relationshipTypes),
    ],

    upsert: async (
      input: RelationshipTypeInput,
      _options?: ServiceRequestOptions
    ): Promise<ApiResponse<RelationshipType>> => {
      nextId += 1;
      const id = input._id ?? `testing-relationship-type-${nextId}`;
      const saved: RelationshipType = { _id: id, name: input.name };
      const index = relationshipTypes.findIndex(type => type._id === id);

      if (index >= 0) {
        relationshipTypes[index] = saved;
      } else {
        relationshipTypes.push(saved);
      }

      return [{ ...saved }];
    },

    delete: async (ids: string[], _options?: ServiceRequestOptions): Promise<ApiResponse<void>> => {
      relationshipTypes = relationshipTypes.filter(type => !ids.includes(type._id));
      return [undefined];
    },

    seed: (next: RelationshipType[]) => {
      relationshipTypes = cloneTypes(next);
    },

    snapshot: () => cloneTypes(relationshipTypes),
  };

  return service;
};

export { createTestingRelationshipTypesService };
export type { TestingRelationshipTypesService, TestingRelationshipTypesServiceOptions };
