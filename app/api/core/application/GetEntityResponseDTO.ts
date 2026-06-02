import { EntityDBO } from '../../entities.v2/database/schemas/EntityTypes.js';
import { FileDTO } from '../domain/files/domainTypes.js';

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
  documents: FileDTO[];
  attachments: FileDTO[];
};
