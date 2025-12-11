import { fileDBO } from 'api/core/infrastructure/mongodb/files/schemas/filesTypes';
import { z } from 'zod';
import { ProcessedPDF } from '../domain/files/ProcessedPDF';
import { Thumbnail } from '../domain/files/Thumbnail';
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

  async execute({ fileId }: Input): Promise<Output> {
    const file = (await this.deps.filesDS.getById(fileId)).getDataOrThrow();
    let thumbnails: Thumbnail[] = [];

    if (file instanceof ProcessedPDF) {
      thumbnails = await this.deps.filesDS.getThumbnails([file]).all();
    }

    await this.transactionManager.run(async () => {
      await this.deps.filesService.delete([file, ...thumbnails]);
    });

    return file.toDTO();
  }
}

export { FileDelete };
