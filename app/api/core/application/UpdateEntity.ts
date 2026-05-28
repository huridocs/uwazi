import { Entity, EntityIcon } from '#api/core/domain/entity/Entity.js';
import { LanguageISO6391, PropertySelectionSchema } from '#shared/types/commonTypes.js';
import { MultiLanguageEntityDataSource } from '#api/entities.v2/contracts/MultiLanguageEntitiesDataSource.js';
import { ArrayUtils } from '#api/common.v2/utils/Array.js';
import { AbstractUseCase } from '../libs/UseCase.js';
import { PropertyAssignmentInput } from './propertyAssignmentCreatorService/PropertyAssignmentCreatorService.js';
import { PropertyAssignmentCreatorServiceStrategy } from './propertyAssignmentCreatorService/PropertyAssignmentCreatorServiceStrategy.js';
import { InputFile } from '../infrastructure/files/InputFile.js';
import { FilesService } from './FilesService.js';
import { TemplatesDataSource } from './contracts/TemplatesDataSource.js';
import { FilesDataSource } from './contracts/FilesDataSource.js';
import { SettingsDataSource } from './contracts/SettingsDataSource.js';
import { BaseFile } from '../domain/files/BaseFile.js';
import { ProcessedPDF } from '../domain/files/ProcessedPDF.js';
import { EntitiesService } from './EntitiesService.js';

type Input = {
  sharedId: string;
  language: LanguageISO6391;
  propertyAssignments: PropertyAssignmentInput[];

  icon?: EntityIcon;
  templateId?: string;
  uploadedFiles?: InputFile[];
  files?: { id: string; originalname: string }[];
  propertySelections?: {
    fileId: string;
    selections: PropertySelectionSchema[];
  };
};

type Output = Entity;

type Deps = {
  propertyAssignmentCreatorServiceStrategy: PropertyAssignmentCreatorServiceStrategy;
  entitiesDS: MultiLanguageEntityDataSource;
  entitiesService: EntitiesService;
  fileService: FilesService;
  templatesDS: TemplatesDataSource;
  filesDS: FilesDataSource;
  settingsDS: SettingsDataSource;
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

    const [keptFiles, removedFiles] = ArrayUtils.splitInTwo(existingFiles, (f: BaseFile) =>
      (input.files || []).some(file => file.id === f.id)
    );

    const updatedFiles: BaseFile[] = [];

    if (input.files) {
      keptFiles.forEach((keptFile: BaseFile) => {
        const update = input.files!.find(file => file.id === keptFile.id);
        if (!update) return;

        updatedFiles.push(keptFile.update({ originalname: update.originalname }));
      });
    }

    const removedPDFIds = removedFiles
      .filter((f): f is ProcessedPDF => f instanceof ProcessedPDF)
      .map(f => f.id);

    const allEntityThumbnails = await this.deps.filesDS.getThumbnails([entity.sharedId]).all();
    const remainingThumbnails = allEntityThumbnails.filter(
      t => !removedPDFIds.some(id => t.filename === `${id}.jpg`)
    );

    const defaultLanguage = await this.deps.settingsDS.getDefaultLanguageKey();
    entity.setPreview(remainingThumbnails, defaultLanguage);

    await this.deps.fileService.storeFiles(filesCreated);

    await this.transactionManager.run(async () => {
      await this.deps.entitiesService.update(entity, {
        actorId: this.actorId,
        targetLanguage: input.language,
      });
      await this.deps.fileService.insert(filesCreated);
      await this.deps.fileService.delete(removedFiles);
      await this.deps.fileService.bulkUpsert(updatedFiles);

      if (input.propertySelections) {
        const fileBelongsToEntity = await this.deps.filesDS.filesExistForEntities([
          { entity: entity.sharedId, _id: input.propertySelections.fileId },
        ]);

        if (fileBelongsToEntity) {
          await this.deps.filesDS.savePropertySelections(
            input.propertySelections.fileId,
            input.propertySelections.selections
          );
        }
      }
    });

    return entity;
  }
}

export { UpdateEntityUseCase };
export type { Input as UpdateEntityUseCaseInput };
