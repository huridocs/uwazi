import { IncomingHttpHeaders } from 'http';
import { EntitySchema } from '#shared/types/entityType.js';

export interface EntityRepository {
  getBySharedId(
    options: {
      sharedId: string;
      language: string;
      omitRelationships?: boolean;
    },
    headers?: IncomingHttpHeaders
  ): Promise<EntitySchema[]>;
  save(entity: EntitySchema): Promise<EntitySchema>;
  getBySharedIds(
    options: {
      sharedIds: string[];
      language: string;
      omitRelationships?: boolean;
    },
    headers?: IncomingHttpHeaders
  ): Promise<EntitySchema[]>;
}
