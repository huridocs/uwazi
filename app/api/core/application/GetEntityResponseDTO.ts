import { EntityDBO } from '../infrastructure/mongodb/entity/EntityDBO.js';
import { FileDTO } from '../domain/files/domainTypes.js';
import type { EntityTranslationsDTO } from '#shared/types/entityWithTranslations.js';

export type RelationDTO = {
  hub: { toString(): string };
  entity: string;
  template: { toString(): string };
  entityData: {
    template: { toString(): string };
    title: string;
    published: boolean;
  };
};

export type GetEntityResponseDTO = EntityDBO & {
  relations?: RelationDTO[];
  translations?: EntityTranslationsDTO;
  documents: FileDTO[];
  attachments: FileDTO[];
};
