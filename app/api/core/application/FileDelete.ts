// eslint-disable-next-line node/no-restricted-import
import { fileDBO } from 'api/core/infrastructure/mongodb/files/schemas/filesTypes';
import { z } from 'zod';
import { FileMappers } from '../infrastructure/mongodb/files/FilesMappers';
import { AbstractUseCase } from '../libs/UseCase';
import { FilesDataSource } from './contracts/FilesDataSource';
import { FilesService } from './FilesService';
import { ProcessedDocument } from '../domain/files/ProcessedDocument';
import { UwaziFile } from '../domain/files/UwaziFile';
import { Thumbnail } from '../domain/files/Thumbnail';

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
    const file: UwaziFile = (await this.deps.filesDS.getById(fileId)).getDataOrThrow();
    let thumbnails: Thumbnail[] = [];

    if (file instanceof ProcessedDocument) {
      thumbnails = await this.deps.filesDS.getThumbnails([file]).all();
    }

    await this.transactionManager.run(async () => {
      await this.deps.filesService.delete([file, ...thumbnails]);
    });

    return FileMappers.toDTO(file);
  }
}

export { FileDelete };
