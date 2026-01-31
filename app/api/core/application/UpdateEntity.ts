import { Entity, EntityIcon } from 'api/core/domain/entity/Entity';
import { LanguageISO6391 } from 'shared/types/commonTypes';
import { MultiLanguageEntityDataSource } from 'api/entities.v2/contracts/MultiLanguageEntitiesDataSource';
import { AbstractUseCase } from '../libs/UseCase';
import { PropertyAssignmentInput } from './propertyAssignmentCreatorService/PropertyAssignmentCreatorService';
import { PropertyAssignmentCreatorServiceStrategy } from './propertyAssignmentCreatorService/PropertyAssignmentCreatorServiceStrategy';
import { InputFile } from '../infrastructure/files/InputFile';
import { FilesService } from './FilesService';
import { EntityUpdatedEvent } from '../domain/entity/EntityUpdatedEvent';
import { TemplatesDataSource } from './contracts/TemplatesDataSource';

type Input = {
  sharedId: string;
  language: LanguageISO6391;

  icon?: EntityIcon;
  generatedToc?: boolean;
  templateId?: string;
  propertyAssignments?: PropertyAssignmentInput[];
  inputFiles?: InputFile[];
  files?: { id: string; originalname: string }[];
};

type Output = Entity;

type Deps = {
  propertyAssignmentCreatorServiceStrategy: PropertyAssignmentCreatorServiceStrategy;
  entitiesDS: MultiLanguageEntityDataSource;
  fileService: FilesService;
  templatesDS: TemplatesDataSource;
};

class UpdateEntityUseCase extends AbstractUseCase<Input, Output, Deps> {
  async execute(input: Input): Promise<Output> {
    const entity = (await this.deps.entitiesDS.getById(input.sharedId)).getDataOrThrow();

    entity.update({
      icon: input.icon,
      generatedToc: input.generatedToc,
    });

    const templateHasChanged = input.templateId && entity.template.id !== input.templateId;
    if (templateHasChanged) {
      const newTemplate = (await this.deps.templatesDS.getById(input.templateId!)).getDataOrThrow();

      entity.changeTemplate(newTemplate);
    }

    const propertyAssignments = await this.deps.propertyAssignmentCreatorServiceStrategy.bulkCreate(
      input.propertyAssignments || [],
      entity.template,
      input?.inputFiles?.filter(f => f.isAttachment()) || []
    );

    entity.setPropertyAssignments(propertyAssignments, input.language, true);

    const filesCreated = (input.inputFiles || []).map(f =>
      f.toEntityFile(entity.sharedId, this.idGenerator.generate())
    );

    await this.deps.fileService.storeFiles(filesCreated);

    await this.transactionManager.run(async () => {
      await this.deps.entitiesDS.update(entity);
      await this.deps.fileService.insert(filesCreated);
      await this.eventEmitter.emit(
        EntityUpdatedEvent.create({
          entity,
          targetLanguage: input.language,
          userId: this.actorId,
        })
      );
    });

    return entity;
  }
}

export { UpdateEntityUseCase };
export type { Input as UpdateEntityUseCaseInput, Deps as UpdateEntityUseCaseDeps };
