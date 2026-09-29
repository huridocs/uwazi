import { z } from 'zod';
import { Entity } from '#api/core/domain/entity/Entity.js';
import { EntitiesDataSource } from '#api/core/application/contracts/EntitiesDataSource.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { PropertyAssignment } from '#api/core/domain/template/PropertyValue.js';
import { Template } from '#api/core/domain/template/Template.js';
import { AbstractUseCase } from '../libs/UseCase.js';
import { PropertyAssignmentInput } from './propertyAssignmentCreatorService/PropertyAssignmentCreatorService.js';
import { PropertyAssignmentCreatorServiceStrategy } from './propertyAssignmentCreatorService/PropertyAssignmentCreatorServiceStrategy.js';
import { TemplatesDataSource } from './contracts/TemplatesDataSource.js';
import { SettingsDataSource } from './contracts/SettingsDataSource.js';
import { EntitiesService, TranslationsInput } from './EntitiesService.js';

const InputSchema = z.object({
  ids: z
    .array(z.string().trim())
    .min(1, 'You must provide at least one entity id for multiple update')
    .max(1000, 'You must provide at most 1000 entity ids for multiple update'),
});

type Input = z.infer<typeof InputSchema> & {
  targetLanguage: LanguageISO6391;
  values: {
    propertyAssignments?: PropertyAssignmentInput[];
    templateId?: string;
    translations?: TranslationsInput;
  };
};

type Output = Entity[];

type Deps = {
  entitiesDS: EntitiesDataSource;
  entitiesService: EntitiesService;
  templatesDS: TemplatesDataSource;
  settingsDS: SettingsDataSource;
  propertyAssignmentCreatorServiceStrategy: PropertyAssignmentCreatorServiceStrategy;
};

type TranslatedValues = {
  languages: LanguageISO6391[];
  defaultLanguage: LanguageISO6391;
  assignments: Partial<Record<LanguageISO6391, PropertyAssignment[]>>;
};

type EntityChange = {
  newTemplate?: Template;
  propertyAssignments: PropertyAssignment[];
  translated?: TranslatedValues;
  targetLanguage: LanguageISO6391;
};

class MultiUpdateEntity extends AbstractUseCase<Input, Output, Deps> {
  static InputSchema = InputSchema;

  async execute(input: Input): Promise<Output> {
    const entities = await this.load(input.ids);
    if (entities.length === 0) return [];

    await this.mutate(entities, input);

    return this.persist(entities, input.targetLanguage);
  }

  private async load(ids: string[]) {
    if (ids.length === 0) return [];

    return (await this.deps.entitiesDS.getEntitiesBySharedIds(ids)).all();
  }

  private async mutate(entities: Entity[], input: Input) {
    const { targetLanguage, values } = input;
    await this.prepareTranslations(values.translations, targetLanguage);

    const newTemplate = values.templateId
      ? (await this.deps.templatesDS.getById(values.templateId)).getDataOrThrow()
      : undefined;
    const referenceTemplate = newTemplate ?? entities[0].template;
    const propertyAssignments = await this.createAssignments(
      values.propertyAssignments,
      referenceTemplate
    );
    const translated = await this.buildTranslations(values.translations, referenceTemplate);

    entities.forEach(entity =>
      MultiUpdateEntity.applyToEntity(entity, {
        newTemplate,
        propertyAssignments,
        translated,
        targetLanguage,
      })
    );
  }

  private async prepareTranslations(
    translations: TranslationsInput | undefined,
    targetLanguage: LanguageISO6391
  ) {
    if (!translations) return;

    await this.deps.entitiesService.validateTranslationLanguages({
      targetLanguage,
      translations,
      partial: true,
    });
  }

  private async createAssignments(
    inputs: PropertyAssignmentInput[] | undefined,
    template: Template
  ) {
    if (!inputs?.length) return [];

    return this.deps.propertyAssignmentCreatorServiceStrategy.bulkCreate(inputs, template);
  }

  private async buildTranslations(
    translations: TranslationsInput | undefined,
    template: Template
  ): Promise<TranslatedValues | undefined> {
    if (!translations) return undefined;

    const [languages, defaultLanguage] = await Promise.all([
      this.deps.settingsDS.getLanguageKeys(),
      this.deps.settingsDS.getDefaultLanguageKey(),
    ]);
    const assignments = await this.createAssignmentsByLanguage(translations, template);

    return { languages, defaultLanguage, assignments };
  }

  private async createAssignmentsByLanguage(translations: TranslationsInput, template: Template) {
    const created = await Promise.all(
      Object.entries(translations).map(async ([language, inputs]) => [
        language,
        await this.createAssignments(inputs, template),
      ])
    );

    return Object.fromEntries(created) as TranslatedValues['assignments'];
  }

  private static applyToEntity(entity: Entity, change: EntityChange) {
    if (change.newTemplate && entity.template.id !== change.newTemplate.id) {
      entity.changeTemplate(change.newTemplate);
    }

    if (change.translated) {
      MultiUpdateEntity.applyTranslations(entity, change.translated);
    }

    if (change.propertyAssignments.length > 0) {
      entity.setPropertyAssignments(change.propertyAssignments, change.targetLanguage, true);
    }
  }

  private static applyTranslations(entity: Entity, translated: TranslatedValues) {
    entity.ensureTranslations(translated.languages, translated.defaultLanguage);

    Object.entries(translated.assignments).forEach(([language, assignments]) => {
      if (!assignments?.length) return;

      entity.setTranslatedPropertyAssignments({
        language: language as LanguageISO6391,
        assignments,
        partial: true,
      });
    });
  }

  private async persist(entities: Entity[], targetLanguage: LanguageISO6391) {
    return this.transactionManager.run(async () => {
      const updatedIds = await this.deps.entitiesService.update(entities, {
        actorId: this.actorId,
        actor: this.getActor(),
        targetLanguage,
      });

      return entities.filter(entity => updatedIds.includes(entity.sharedId));
    });
  }
}

export { MultiUpdateEntity };
export type {
  Input as MultiUpdateEntityInput,
  Output as MultiUpdateEntityOutput,
  Deps as MultiUpdateEntityDeps,
};
