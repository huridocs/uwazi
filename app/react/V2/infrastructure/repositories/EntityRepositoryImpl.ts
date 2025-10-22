import { IncomingHttpHeaders } from 'http';
import { EntitySchema } from 'shared/types/entityType';
import { EntityRepository } from './EntityRepository';
import * as entitiesApi from '../../api/entities/index';
import * as searchEntitiesApi from '../../api/search/index';

export class EntityRepositoryImpl implements EntityRepository {
  constructor() {}
  async getBySharedId(
    options: { sharedId: string; language: string; omitRelationships?: boolean },
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
