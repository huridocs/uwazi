import { IncomingHttpHeaders } from 'http';
import { EntitySchema } from '#shared/types/entityType.js';
import { EntityRepository } from '#V2/infrastructure/repositories/EntityRepository.js';
import * as entitiesApi from '#V2/api/entities/index.js';
import * as searchEntitiesApi from '#V2/api/search/index.js';

export class EntityRepositoryImpl implements EntityRepository {
  constructor() {}

  async getBySharedId(
    options: {
      sharedId: string;
      language: string;
      omitRelationships?: boolean;
    },
    headers?: IncomingHttpHeaders
  ): Promise<EntitySchema[]> {
    return entitiesApi.getBySharedId(options, headers);
  }

  async save(_entity: EntitySchema): Promise<EntitySchema> {
    throw new Error('Method not implemented.');
  }

  async getBySharedIds(
    options: { sharedIds: string[]; language: string; omitRelationships?: boolean },
    headers?: IncomingHttpHeaders
  ): Promise<EntitySchema[]> {
    try {
      if (options.sharedIds.length === 0) {
        return [];
      }

      const searchString = `sharedId:(${options.sharedIds.join(' OR ')})`;

      const response = await searchEntitiesApi.search(
        {
          filters: {
            searchString,
          },
          fields: ['_id', 'title', 'template', 'metadata', 'language'],
          limit: options.sharedIds.length,
        },
        headers
      );

      return response.rows || [];
    } catch (error) {
      return [];
    }
  }
}
