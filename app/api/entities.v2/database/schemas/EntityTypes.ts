import { EntityDBO } from '#api/core/infrastructure/mongodb/entity/EntityDBO.js';

export type MultiLanguageEntityDBO = {
  sharedId: string;
  translations: {
    [language: string]: EntityDBO;
  };
  template: string;
};
