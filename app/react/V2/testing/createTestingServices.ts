import type { RelationshipType } from '#shared/contracts/RelationshipType.js';
import type { Template } from '#shared/contracts/Template.js';
import type { Thesaurus } from '#shared/contracts/Thesaurus.js';
import { httpServices } from '#V2/services/http/index.js';
import type { V2Services } from '#V2/services/types.js';
import {
  createTestingRelationshipTypesService,
  type TestingRelationshipTypesService,
} from './TestingRelationshipTypesService.js';
import {
  createTestingTemplatesService,
  type TestingTemplatesService,
} from './TestingTemplatesService.js';
import {
  createTestingThesaurisService,
  type TestingThesaurisService,
} from './TestingThesaurisService.js';

type CreateTestingServicesOptions = {
  initialThesauri?: Thesaurus[];
  initialRelationshipTypes?: RelationshipType[];
  initialTemplates?: Template[];
  initialTemplateEntityCounts?: Record<string, number>;
};

type CreateTestingServicesResult = {
  services: V2Services;
  thesauri: TestingThesaurisService;
  relationshipTypes: TestingRelationshipTypesService;
  templates: TestingTemplatesService;
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
  const templates = createTestingTemplatesService({
    initialTemplates: options?.initialTemplates,
    initialEntityCounts: options?.initialTemplateEntityCounts,
  });

  return {
    services: {
      ...httpServices,
      thesauri,
      relationshipTypes,
      templates,
    },
    thesauri,
    relationshipTypes,
    templates,
  };
};

export { createTestingServices };
export type { CreateTestingServicesResult, CreateTestingServicesOptions };
