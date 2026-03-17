import { EntityDBO } from '../../entities.v2/database/schemas/EntityTypes.js';
import { fileDTO } from '../infrastructure/mongodb/files/schemas/filesTypes.js';

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
  documents: fileDTO[];
  attachments: fileDTO[];
};
