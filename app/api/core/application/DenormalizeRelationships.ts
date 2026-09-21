import { EntitiesDataSource } from '#api/core/application/contracts/EntitiesDataSource.js';
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
}

export { DenormalizeRelationshipsUseCase };
export type { Input as DenormalizeRelationshipsUseCaseInput };
