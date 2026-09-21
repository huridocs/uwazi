import { EntitiesDataSource } from '#api/core/application/contracts/EntitiesDataSource.js';
import { Entity } from '#api/core/domain/entity/Entity.js';
import { IndexTypes } from '#shared/data_utils/objectIndex.js';
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

type RelatedEntities = Record<IndexTypes, Entity | undefined>;

function overlayBatchEntities(entities: Entity[], relatedEntities: RelatedEntities) {
  // Prefer the in-memory batch over their stored copies.
  entities.forEach(entity => {
    relatedEntities[entity.sharedId] = entity;
  });
}

function denormalizeUntilStable(entities: Entity[], relatedEntities: RelatedEntities) {
  // Repeat until a full pass changes nothing; bounded against cyclic inherit.
  for (let pass = 0; pass < entities.length; pass += 1) {
    let changed = false;
    entities.forEach(entity => {
      if (entity.denormalizeRelationshipProps(relatedEntities)) {
        changed = true;
      }
    });
    if (!changed) return;
  }
}

class DenormalizeRelationshipsUseCase extends AbstractUseCase<Input, Output, Deps> {
  async execute(input: Input): Promise<Output> {
    const entities = await (
      await this.deps.entitiesDS.getEntitiesBySharedIds(input.sharedIds)
    ).all();

    if (entities.length === 0) {
      return;
    }

    const defaultLanguage = await this.deps.settingsDS.getDefaultLanguageKey();

    const referencedIds = new Set<string>();
    entities.forEach(entity =>
      entity
        .getReferencedRelationshipEntitySharedIds(defaultLanguage)
        .forEach(id => referencedIds.add(id))
    );

    const relatedEntities = await (
      await this.deps.entitiesDS.getEntitiesBySharedIds([...referencedIds])
    ).indexed(entity => entity.sharedId);

    await this.transactionManager.run(async () => {
      overlayBatchEntities(entities, relatedEntities);
      denormalizeUntilStable(entities, relatedEntities);

      await this.deps.entitiesService.update(entities, {
        actorId: this.actorId,
        actor: this.getActor(),
        targetLanguage: defaultLanguage,
        authorize: false,
        denormalizeRelationships: false,
      });
    });
  }
}

export { DenormalizeRelationshipsUseCase };
export type { Input as DenormalizeRelationshipsUseCaseInput };
