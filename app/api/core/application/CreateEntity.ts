import { ArrayUtils } from 'api/common.v2/utils/Array';
import { Entity, EntityIcon } from 'api/core/domain/entity/Entity';
import { MultiLanguageEntityDataSource } from 'api/entities.v2/contracts/MultiLanguageEntitiesDataSource';
import { EntityCreatedEvent } from 'api/entities/events/EntityCreatedEvent';
import { Attachment } from 'api/files.v2/model/Attachment';
import { InputFile } from 'api/files.v2/model/InputFile';
import { TranslationsDataSource } from 'api/i18n.v2/contracts/TranslationsDataSource';
import date from 'api/utils/date';
import { TemplatesDataSource } from '../domain/template/TemplatesDataSource';
import { MongoEntityMapper } from '../infrastructure/mongodb/entity/MongoEntityMapper';
import { ThesauriDataSource } from '../infrastructure/mongodb/thesauri/MongoThesauriDS';
import { AbstractUseCase } from '../libs/UseCase';
import { EntityCreatorService } from './EntityCreatorService';
import { FilesService } from './FilesService';
import { SettingsDataSource } from './contracts/SettingsDataSource';
import { PropertyAssignmentInput } from './propertyAssignmentCreatorService/PropertyAssignmentCreatorService';
import { PropertyAssignmentCreatorServiceStrategy } from './propertyAssignmentCreatorService/PropertyAssignmentCreatorServiceStrategy';

type Input = {
  propertyAssignments: PropertyAssignmentInput[];
  attachments: InputFile[];
  templateId?: string;
  icon?: EntityIcon;
};

type Output = Entity;

type Deps = {
  fileService: FilesService;
  thesauriDS: ThesauriDataSource;
  translationsDS: TranslationsDataSource;
  settingsDS: SettingsDataSource;
  templatesDS: TemplatesDataSource;
  multiLanguageEntityDS: MultiLanguageEntityDataSource;
};

class CreateEntityUseCase extends AbstractUseCase<Input, Output, Deps> {
  protected async executeAsync({
    templateId,
    icon,
    propertyAssignments: propertyAssignmentsInput,
    attachments: inputFiles,
  }: Input): Promise<Output> {
    const propertyAssignmentCreatorService = PropertyAssignmentCreatorServiceStrategy.create(
      this.deps
    );
    const entityCreatorService = new EntityCreatorService(this.deps);

    const entity = await entityCreatorService.create({
      templateId,
      icon,
      userId: this.actor?.id,
    });

    const propertyAssignments = await propertyAssignmentCreatorService.bulkCreate(
      propertyAssignmentsInput,
      entity.template,
      inputFiles.filter(f => f.isAttachment())
    );

    entity.setPropertyAssignmentsInAllLanguages(propertyAssignments, true);

    const attachments = await this.deps.fileService.fromInputFiles(
      entity.sharedId,
      inputFiles
    );

    await this.deps.fileService.storeFiles(attachments);

    await this.transactionManager.run(async () => {
      await this.deps.multiLanguageEntityDS.create(entity);

      await this.deps.fileService.insert(attachments);
    });

    // Leave it outside of the transaction so once consumers
    // react to the event the transaction is definitely closed/committed, hopefully.
    // This is important if any consumer wants to read the created entity.
    // Still not ideal, but better than nothing.
    await this.eventBus.emit(
      new EntityCreatedEvent({
        entities: MongoEntityMapper.toDBO(entity) as any,
        targetLanguageKey: entity.languages[0],
      })
    );

    return entity;
  }
}

export { CreateEntityUseCase };
export type { Input as CreateEntityUseCaseInput };
