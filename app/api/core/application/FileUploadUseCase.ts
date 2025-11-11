import { FilesDataSource } from 'api/files.v2/contracts/FilesDataSource';
import { Document } from 'api/files.v2/model/Document';
import date from 'api/utils/date';
// eslint-disable-next-line node/no-restricted-import
import { MultiLanguageEntityDataSource } from 'api/entities.v2/contracts/MultiLanguageEntitiesDataSource';
import { FileStorage } from 'api/files.v2/contracts/FileStorage';
import { FileMappers } from 'api/files.v2/database/FilesMappers';
import { fileDBO } from 'api/files.v2/database/schemas/filesTypes';
import { InputFile } from 'api/files.v2/model/InputFile';
import { PDFPostProcessJob } from '../infrastructure/jobs/PDFPostProcessJob';
import { AbstractUseCase } from '../libs/UseCase';
import { AJVObject, ValidationError } from '../domain/error/ValidationError';

type Input = {
  uploadedFile: InputFile;
  entityId: string;
};

type Output = Omit<fileDBO, '_id'> & { _id: string };

type Deps = {
  filesDS: FilesDataSource;
  fileStorage: FileStorage;
  entitiesDS: MultiLanguageEntityDataSource;
};

class EntityNotFoundError extends ValidationError {
  constructor(sharedId: string) {
    super(`Entity not found: [sharedId=${sharedId}]`, 'entity.entity_not_found');
  }

  asAJV(): AJVObject {
    return {
      message: this.message,
      keyword: 'notFound',
    };
  }
}

class FileUploadUseCase extends AbstractUseCase<Input, Output, Deps> {
  protected async executeAsync({ entityId, uploadedFile }: Input): Promise<Output> {
    const entity = await (await this.deps.entitiesDS.getEntitiesBySharedIds([entityId])).first();
    if (!entity) {
      throw new EntityNotFoundError(`Entity ${entityId}, not found`);
    }
    const document = new Document({
      id: this.idGenerator.generate(),
      entity: entityId,
      ...uploadedFile.metadata,
      filename: uploadedFile.filename,
      uploaded: true,
      status: 'processing',
      creationDate: date.currentUTC(),
    });

    await this.transactionManager.run(async () => {
      await this.deps.filesDS.create(document);
      await this.deps.fileStorage.storeFile({
        type: 'document',
        file: uploadedFile.contents,
      });
    });

    await this.jobsDispatcher.dispatch(PDFPostProcessJob, {
      documentId: document.id,
      userId: this.actorId,
      tenantName: this.tenant.name,
    });

    return FileMappers.toDTO(document);
  }
}

export { FileUploadUseCase, EntityNotFoundError };
