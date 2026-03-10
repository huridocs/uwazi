import { Entity, EntityIcon } from 'api/core/domain/entity/Entity';
import { LanguageISO6391 } from 'shared/types/commonTypes';
import { MultiLanguageEntityDataSource } from 'api/entities.v2/contracts/MultiLanguageEntitiesDataSource';
import { ArrayUtils } from 'api/common.v2/utils/Array';
import { AbstractUseCase } from '../libs/UseCase';
import { PropertyAssignmentInput } from './propertyAssignmentCreatorService/PropertyAssignmentCreatorService';
import { PropertyAssignmentCreatorServiceStrategy } from './propertyAssignmentCreatorService/PropertyAssignmentCreatorServiceStrategy';
import { InputFile } from '../infrastructure/files/InputFile';
import { FilesService } from './FilesService';
import { TemplatesDataSource } from './contracts/TemplatesDataSource';
import { FilesDataSource } from './contracts/FilesDataSource';
import { BaseFile } from '../domain/files/BaseFile';
import { EntitiesService } from './EntitiesService';

type Input = {
  sharedId: string;
  language: LanguageISO6391;
  propertyAssignments: PropertyAssignmentInput[];

  icon?: EntityIcon;
  templateId?: string;
  uploadedFiles?: InputFile[];
  files?: { id: string; originalname: string }[];
};

type Output = Entity;

type Deps = {
  propertyAssignmentCreatorServiceStrategy: PropertyAssignmentCreatorServiceStrategy;
  entitiesDS: MultiLanguageEntityDataSource;
  entitiesService: EntitiesService;
  fileService: FilesService;
  templatesDS: TemplatesDataSource;
  filesDS: FilesDataSource;
};

class UpdateEntityUseCase extends AbstractUseCase<Input, Output, Deps> {
  async execute(input: Input): Promise<Output> {
    const entity = (await this.deps.entitiesDS.getById(input.sharedId)).getDataOrThrow();

    entity.update({
      icon: input.icon,
    });

    const templateHasChanged = !!input.templateId && entity.template.id !== input.templateId;
    if (templateHasChanged) {
      const newTemplate = (await this.deps.templatesDS.getById(input.templateId!)).getDataOrThrow();

      entity.changeTemplate(newTemplate);
    }

    const propertyAssignments = await this.deps.propertyAssignmentCreatorServiceStrategy.bulkCreate(
      input.propertyAssignments,
      entity.template,
      input?.uploadedFiles?.filter(f => f.isAttachment())
    );

    entity.setPropertyAssignments(propertyAssignments, input.language, true);

    const filesCreated = (input.uploadedFiles || []).map(f =>
      f.toEntityFile(entity.sharedId, this.idGenerator.generate())
    );

    const existingFiles = await this.deps.filesDS.getByEntitiesIds([entity.sharedId]).all();

    const [keptFiles, removedFiles] = ArrayUtils.splitInTwo(existingFiles, f =>
      (input.files || []).some(file => file.id === f.id)
    );

    const updatedFiles: BaseFile[] = [];

    if (input.files) {
      keptFiles.forEach(keptFile => {
        const update = input.files!.find(file => file.id === keptFile.id);
        if (!update) return;

        updatedFiles.push(keptFile.update({ originalname: update.originalname }));
      });
    }

    await this.deps.fileService.storeFiles(filesCreated);

    await this.transactionManager.run(async () => {
      await this.deps.entitiesService.upsert(entity, {
        actorId: this.actorId,
        targetLanguage: input.language,
      });
      await this.deps.fileService.insert(filesCreated);
      await this.deps.fileService.delete(removedFiles);
      await this.deps.fileService.bulkUpsert(updatedFiles);
    });

    return entity;
  }
}

export { UpdateEntityUseCase };
export type { Input as UpdateEntityUseCaseInput, Deps as UpdateEntityUseCaseDeps };
