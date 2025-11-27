// eslint-disable-next-line node/no-restricted-import
import { fileDBO } from 'api/core/infrastructure/mongodb/files/schemas/filesTypes';
import { z } from 'zod';
import { FileMappers } from '../infrastructure/mongodb/files/FilesMappers';
import { AbstractUseCase } from '../libs/UseCase';
import { FilesDataSource } from './contracts/FilesDataSource';
import { FilesService } from './FilesService';

type Output = Omit<fileDBO, '_id'> & { _id: string };

type Deps = {
  filesDS: FilesDataSource;
  filesService: FilesService;
};

const fileUploadInputSchema = z.object({
  fileId: z.string(),
});

type Input = z.infer<typeof fileUploadInputSchema>;

class FileDelete extends AbstractUseCase<Input, Output, Deps> {
  static inputSchema = fileUploadInputSchema;

  protected async executeAsync({ fileId }: Input): Promise<Output> {
    const file = (await this.deps.filesDS.getById(fileId)).getDataOrThrow();

    await this.transactionManager.run(async () => {
      await this.deps.filesService.delete([file]);
    });

    // await this.eventBus.emit(new FilesDeletedEvent({}));
    return FileMappers.toDTO(file);
  }
}

export { FileDelete };
