import { ArrayUtils } from 'api/common.v2/utils/Array';
import { MongoResultSet } from 'api/core/infrastructure/mongodb/common/MongoResultSet';
import { Entity } from 'api/core/domain/entity/Entity';
import { MongoMultiLanguageEntityDataSource } from './MongoMultiLanguageEntityDataSource';
import { EntityTemplateAggregation } from './schemas/EntityTypes';

export class CachedMongoEntitiesDataSource extends MongoMultiLanguageEntityDataSource {
  private cache = new Map<string, any>();

  override async getEntitiesBySharedIds(sharedIds: string[]) {
    const [cached, notCached] = ArrayUtils.splitInTwo(sharedIds, id => this.cache.has(id));
    const result = await super.getEntitiesBySharedIds(notCached);

    return {
      ...result,
      all: async () => {
        const notCachedEntities = await result.all();

        notCachedEntities.forEach(entity => {
          this.cache.set(entity.sharedId, entity);
        });

        const cachedEntities = cached.map(id => this.cache.get(id));

        return [...cachedEntities, ...notCachedEntities];
      },
    } as MongoResultSet<EntityTemplateAggregation, Entity>;
  }
}
