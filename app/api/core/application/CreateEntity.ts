// oxlint-disable max-statements
import { Entity, EntityIcon } from '#api/core/domain/entity/Entity.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { InputFile } from '#api/core/infrastructure/files/InputFile.js';
import { AbstractUseCase } from '../libs/UseCase.js';
import { EntitiesService, TranslationsInput } from './EntitiesService.js';
import { FilesService } from './FilesService.js';
import { PropertyAssignmentInput } from './propertyAssignmentCreatorService/PropertyAssignmentCreatorService.js';
import { PropertyAssignmentCreatorServiceStrategy } from './propertyAssignmentCreatorService/PropertyAssignmentCreatorServiceStrategy.js';

type Input = {
  propertyAssignments: PropertyAssignmentInput[];
  inputFiles?: InputFile[];
  templateId?: string;
  icon?: EntityIcon;
  translations?: TranslationsInput;
};

type Output = Entity;

type Deps = {
  fileService: FilesService;
  entitiesService: EntitiesService;
  propertyAssignmentCreatorServiceStrategy: PropertyAssignmentCreatorServiceStrategy;
};

class CreateEntityUseCase extends AbstractUseCase<Input, Output, Deps> {
  async execute(input: Input): Promise<Output> {
    if (input.translations) {
      await this.deps.entitiesService.validateTranslationLanguages({
        targetLanguage: this.targetLanguage,
        translations: input.translations,
        partial: true,
      });
    }

    const entity = await this.deps.entitiesService.create({
      templateId: input.templateId,
      icon: input.icon,
      userId: this.actor?.id,
    });

    const propertyAssignments = await this.deps.propertyAssignmentCreatorServiceStrategy.bulkCreate(
      input.propertyAssignments,
      entity.template,
      input?.inputFiles?.filter(f => f.isAttachment()) || []
    );

    entity.setPropertyAssignmentsInAllLanguages(propertyAssignments, true);

    // Target language values are copied into every language first; translations overwrite theirs, so required
    // properties are validated again over the final state.
    if (input.translations) {
      await this.applyTranslations(entity, input.translations);
      entity.validateRequiredProperties();
    }

    const documentsOrAttachments = (input.inputFiles || []).map(f =>
      f.toEntityFile(entity.sharedId, this.idGenerator.generate())
    );

    await this.deps.fileService.storeFiles(documentsOrAttachments);

    await this.transactionManager.run(async () => {
      await this.deps.entitiesService.insert([entity], {
        actorId: this.actorId,
        tenantName: this.tenant.name,
        targetLanguage: this.targetLanguage,
        providedTranslations: CreateEntityUseCase.providedTranslations(input.translations),
      });

      await this.deps.fileService.insert(documentsOrAttachments);
    });

    return entity;
  }

  private static providedTranslations(translations?: TranslationsInput) {
    if (!translations) return undefined;
    return Object.fromEntries(
      Object.entries(translations).map(([language, values]) => [
        language,
        (values ?? []).map(({ name }) => name),
      ])
    );
  }

  private async applyTranslations(entity: Entity, translations: TranslationsInput) {
    await Promise.all(
      Object.entries(translations).map(async ([language, values]) => {
        const assignments = await this.deps.propertyAssignmentCreatorServiceStrategy.bulkCreate(
          values ?? [],
          entity.template
        );
        entity.setTranslatedPropertyAssignments({
          language: language as LanguageISO6391,
          assignments,
          partial: true,
        });
      })
    );
  }
}

export { CreateEntityUseCase };
export type { Input as CreateEntityUseCaseInput };
