import type { RelationshipType } from '#shared/contracts/RelationshipType.js';
import type { Thesaurus } from '#shared/contracts/Thesaurus.js';
import { httpServices } from '#V2/services/http/index.js';
import type { V2Services } from '#V2/services/types.js';
import {
  createTestingRelationshipTypesService,
  type TestingRelationshipTypesService,
} from './TestingRelationshipTypesService.js';
import {
  createTestingThesaurisService,
  type TestingThesaurisService,
} from './TestingThesaurisService.js';

type CreateTestingServicesOptions = {
  initialThesauri?: Thesaurus[];
  initialRelationshipTypes?: RelationshipType[];
};

type CreateTestingServicesResult = {
  services: V2Services;
  thesauri: TestingThesaurisService;
  relationshipTypes: TestingRelationshipTypesService;
};

const createTestingServices = (
  options?: CreateTestingServicesOptions
): CreateTestingServicesResult => {
  const thesauri = createTestingThesaurisService({
    initialThesauri: options?.initialThesauri,
  });
  const relationshipTypes = createTestingRelationshipTypesService({
    initialRelationshipTypes: options?.initialRelationshipTypes,
  });

  return {
    services: {
      ...httpServices,
      thesauri,
      relationshipTypes,
    },
    thesauri,
    relationshipTypes,
  };
};

export { createTestingServices };
export type { CreateTestingServicesResult, CreateTestingServicesOptions };
