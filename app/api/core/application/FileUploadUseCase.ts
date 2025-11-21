// eslint-disable-next-line node/no-restricted-import
import { MultiLanguageEntityDataSource } from 'api/entities.v2/contracts/MultiLanguageEntitiesDataSource';
import { FileMappers } from 'api/core/infrastructure/mongodb/files/FilesMappers';
import { InputFile } from 'api/files.v2/model/InputFile';
import { fileDBO } from 'api/core/infrastructure/mongodb/files/schemas/filesTypes';
import { FilesService } from './FilesService';
import { AJVObject, ValidationError } from '../domain/error/ValidationError';
import { AbstractUseCase } from '../libs/UseCase';

type Input = {
  uploadedFile: InputFile;
  entityId: string;
};

type Output = Omit<fileDBO, '_id'> & { _id: string };

type Deps = {
  entitiesDS: MultiLanguageEntityDataSource;
  filesService: FilesService;
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

    const [document] = await this.deps.filesService.fromInputFiles(entityId, [uploadedFile]);

    await this.deps.filesService.storeFiles([document]);

    await this.transactionManager.run(async () => {
      await this.deps.filesService.insert([document]);
    });

    return FileMappers.toDTO(document);
  }
}

export { EntityNotFoundError, FileUploadUseCase };
