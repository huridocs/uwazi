// eslint-disable-next-line node/no-restricted-import
import { InputFile } from 'api/core/infrastructure/files/InputFile';
import { fileDBO } from 'api/core/infrastructure/mongodb/files/schemas/filesTypes';
import { MultiLanguageEntityDataSource } from 'api/entities.v2/contracts/MultiLanguageEntitiesDataSource';
import { z } from 'zod';
import { AbstractUseCase } from '../libs/UseCase';
import { FilesService } from './FilesService';
import { EntityNotFoundError } from './errors';

type Output = Omit<fileDBO, '_id'> & { _id: string };

type Deps = {
  entitiesDS: MultiLanguageEntityDataSource;
  filesService: FilesService;
};

const fileUploadInputSchema = z.object({
  entityId: z.string(),
  uploadedFile: z.instanceof(InputFile),
});

type Input = z.infer<typeof fileUploadInputSchema>;

export class FileUploadForEntity extends AbstractUseCase<Input, Output, Deps> {
  static inputSchema = fileUploadInputSchema;

  async execute({ entityId, uploadedFile }: Input): Promise<Output> {
    const entity = await (await this.deps.entitiesDS.getEntitiesBySharedIds([entityId])).first();
    if (!entity) {
      throw new EntityNotFoundError(entityId);
    }

    const file = uploadedFile.toEntityFile(entityId, this.idGenerator.generate());

    await this.deps.filesService.storeFiles([file]);

    await this.transactionManager.run(async () => {
      await this.deps.filesService.insert([file]);
    });

    return file.toDTO();
  }
}
