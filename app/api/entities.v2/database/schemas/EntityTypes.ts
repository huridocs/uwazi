import { EntityDBO } from '#api/core/infrastructure/mongodb/entity/EntityDBO.js';

export interface EntityJoinTemplate extends EntityDBO {
  joinedTemplate: {
    properties: { name: string; type: string; query: any; denormalizedProperty?: string }[];
  }[];
}

export type MultiLanguageEntityDBO = {
  sharedId: string;
  translations: {
    [language: string]: EntityDBO;
  };
  template: string;
};
