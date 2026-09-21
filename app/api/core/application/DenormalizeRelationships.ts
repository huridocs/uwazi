import { EntitiesDataSource } from '#api/core/application/contracts/EntitiesDataSource.js';
import { Entity } from '#api/core/domain/entity/Entity.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { AbstractUseCase } from '../libs/UseCase.js';
import { EntitiesService } from './EntitiesService.js';
import { SettingsDataSource } from './contracts/SettingsDataSource.js';

type Input = {
  sharedIds: string[];
};

type Output = void;

type Deps = {
  entitiesDS: EntitiesDataSource;
  entitiesService: EntitiesService;
  settingsDS: SettingsDataSource;
};

class DenormalizeRelationshipsUseCase extends AbstractUseCase<Input, Output, Deps> {
  async execute(input: Input): Promise<Output> {
    const entities = await (
      await this.deps.entitiesDS.getEntitiesBySharedIds(input.sharedIds)
    ).all();

    if (entities.length === 0) {
      return;
    }

    const defaultLanguage = await this.deps.settingsDS.getDefaultLanguageKey();

    const relatedEntities = await this.loadReferencedEntities(entities, defaultLanguage);

    await this.transactionManager.run(async () => {
      entities.forEach(entity => entity.denormalizeRelationshipProps(relatedEntities));

      await this.deps.entitiesService.update(entities, {
        actorId: this.actorId,
        actor: this.getActor(),
        targetLanguage: defaultLanguage,
        authorize: false,
        denormalizeRelationships: false,
      });
    });
  }

  private async loadReferencedEntities(
    entities: Entity[],
    language: LanguageISO6391
  ): Promise<Record<string, Entity>> {
    const index: Record<string, Entity> = {};
    const seen = new Set<string>();
    const queue = new Set<string>();

    const enqueue = (id: string) => {
      if (!seen.has(id)) {
        seen.add(id);
        queue.add(id);
      }
    };

    entities.forEach(entity =>
      entity.getReferencedRelationshipEntitySharedIds(language).forEach(enqueue)
    );

    while (queue.size > 0) {
      // eslint-disable-next-line no-await-in-loop -- each BFS layer depends on the previous level's references
      const fetched = await (await this.deps.entitiesDS.getEntitiesBySharedIds([...queue])).all();
      queue.clear();

      fetched.forEach(entity => {
        index[entity.sharedId] = entity;
        entity.getReferencedRelationshipEntitySharedIds(language).forEach(enqueue);
      });
    }

    return index;
  }
}

export { DenormalizeRelationshipsUseCase };
export type { Input as DenormalizeRelationshipsUseCaseInput };
