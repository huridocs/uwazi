import { EntityDBO } from '../../entities.v2/database/schemas/EntityTypes.js';
import { fileDTO } from '../infrastructure/mongodb/files/schemas/filesTypes.js';

/**
 * Represents a relation in the GetEntity response.
 * This is an inline type specific to the GetEntity use case to avoid tight coupling.
 */
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

/**
 * Response DTO for the GetEntity use case.
 * Extends EntityDBO with additional computed fields for relations, documents, and attachments.
 */
export type GetEntityResponseDTO = EntityDBO & {
  relations?: RelationDTO[];
  documents: fileDTO[];
  attachments: fileDTO[];
};
