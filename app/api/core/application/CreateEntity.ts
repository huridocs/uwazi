import { Entity, EntityIcon } from 'api/core/domain/entity/Entity';
import { MultiLanguageEntityDataSource } from 'api/entities.v2/contracts/MultiLanguageEntitiesDataSource';
import { TranslationsDataSource } from 'api/i18n.v2/contracts/TranslationsDataSource';
import { ArrayUtils } from 'api/common.v2/utils/Array';
import { FileStorage } from 'api/files.v2/contracts/FileStorage';
import { FileContents } from 'api/files.v2/model/FileContents';
import { FilesDataSource } from 'api/files.v2/contracts/FilesDataSource';
import { Attachment } from 'api/files.v2/model/Attachment';
import date from 'api/utils/date';
import { AbstractUseCase } from '../libs/UseCase';
import { TemplatesDataSource } from '../domain/template/TemplatesDataSource';
import { SettingsDataSource } from './contracts/SettingsDataSource';
import { PropertyAssignmentCreatorServiceStrategy } from './propertyAssignmentCreatorService/PropertyAssignmentCreatorServiceStrategy';
import { ThesauriDataSource } from '../infrastructure/mongodb/thesauri/MongoThesauriDS';
import { PropertyAssignmentInput } from './propertyAssignmentCreatorService/PropertyAssignmentCreatorService';

type Input = {
  propertyAssignments: PropertyAssignmentInput[];
  attachments: Express.Multer.File[];
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
  protected async executeAsync(input: Input): Promise<Output> {
    const service = PropertyAssignmentCreatorServiceStrategy.create(this.deps);

    const template = await this.getTemplateByIdOrDefault(input.templateId);
    const languages = await this.deps.settingsDS.getLanguageKeys();

    const entity = Entity.create(
      {
        languages,
        userId: this.actor?.id,
        template,
        icon: input.icon,
      },
      this.idGenerator
    );

    const propertyAssignments = await service.bulkCreate(
      input.propertyAssignments,
      template,
      input.attachments
    );

    entity.setPropertyAssignments(propertyAssignments, undefined, true);

    await ArrayUtils.sequentialFor(input.attachments, async attachment =>
      this.deps.filesStorage.storeFile({
        type: 'attachment',
        file: FileContents.fromPath([attachment.destination, attachment.filename]),
      })
    );

    await this.transactionManager.run(async () => {
      await this.deps.multiLanguageEntityDS.create(entity);

      await ArrayUtils.sequentialFor(input.attachments, async attachment =>
        this.deps.filesDS.create(
          new Attachment({
            id: this.idGenerator.generate(),
            entity: entity.sharedId,
            creationDate: date.currentUTC(),
            filename: attachment.filename,
            mimetype: attachment.mimetype,
            originalname: attachment.originalname,
            size: attachment.size,
          })
        )
      );
    });

    return entity;
  }

  private async getTemplateByIdOrDefault(templateId?: string) {
    if (templateId) {
      return (await this.deps.templatesDS.getById(templateId)).getDataOrThrow();
    }

    return (await this.deps.templatesDS.getDefaultTemplate()).getDataOrThrow();
  }
}

export { CreateEntityUseCase };
export type { Input as CreateEntityUseCaseInput };
