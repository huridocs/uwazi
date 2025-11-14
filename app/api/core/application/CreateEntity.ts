import { Entity, EntityIcon } from 'api/core/domain/entity/Entity';
import { MultiLanguageEntityDataSource } from 'api/entities.v2/contracts/MultiLanguageEntitiesDataSource';
import { TranslationsDataSource } from 'api/i18n.v2/contracts/TranslationsDataSource';
import { ArrayUtils } from 'api/common.v2/utils/Array';
import { FileStorage } from 'api/files.v2/contracts/FileStorage';
import { FilesDataSource } from 'api/files.v2/contracts/FilesDataSource';
import { Attachment } from 'api/files.v2/model/Attachment';
import date from 'api/utils/date';
import { InputFile } from 'api/files.v2/model/InputFile';
import { EntityCreatedEvent } from 'api/entities/events/EntityCreatedEvent';
import { AbstractUseCase } from '../libs/UseCase';
import { TemplatesDataSource } from '../domain/template/TemplatesDataSource';
import { SettingsDataSource } from './contracts/SettingsDataSource';
import { PropertyAssignmentCreatorServiceStrategy } from './propertyAssignmentCreatorService/PropertyAssignmentCreatorServiceStrategy';
import { ThesauriDataSource } from '../infrastructure/mongodb/thesauri/MongoThesauriDS';
import { PropertyAssignmentInput } from './propertyAssignmentCreatorService/PropertyAssignmentCreatorService';
import { EntityCreatorService } from './EntityCreatorService';
import { MongoEntityMapper } from '../infrastructure/mongodb/entity/MongoEntityMapper';

type Input = {
  propertyAssignments: PropertyAssignmentInput[];
  attachments: InputFile[];
  templateId?: string;
  icon?: EntityIcon;
};

type Output = Entity;

type Deps = {
  filesDS: FilesDataSource;
  thesauriDS: ThesauriDataSource;
  translationsDS: TranslationsDataSource;
  settingsDS: SettingsDataSource;
  templatesDS: TemplatesDataSource;
  filesStorage: FileStorage;
  multiLanguageEntityDS: MultiLanguageEntityDataSource;
};

class CreateEntityUseCase extends AbstractUseCase<Input, Output, Deps> {
  protected async executeAsync({
    templateId,
    icon,
    propertyAssignments: propertyAssignmentsInput,
    attachments,
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
      attachments
    );

    entity.setPropertyAssignmentsInAllLanguages(propertyAssignments, true);

    await ArrayUtils.sequentialFor(attachments, async attachment =>
      this.deps.filesStorage.storeFile({
        type: 'attachment',
        file: attachment.contents,
      })
    );

    await this.transactionManager.run(async () => {
      await this.deps.multiLanguageEntityDS.create(entity);

      if (attachments.length > 0) {
        await this.deps.filesDS.bulkCreate(
          attachments.map(
            attachment =>
              new Attachment({
                id: this.idGenerator.generate(),
                entity: entity.sharedId,
                creationDate: date.currentUTC(),
                filename: attachment.filename,
                mimetype: attachment.metadata.mimetype,
                originalname: attachment.metadata.originalname,
                size: attachment.metadata.size,
              })
          )
        );
      }
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
