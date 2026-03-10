import { fileDBO } from 'api/core/infrastructure/mongodb/files/schemas/filesTypes';
import { z } from 'zod';
import { createError } from 'api/utils';
import { ProcessedPDF } from '../domain/files/ProcessedPDF';
import { Thumbnail } from '../domain/files/Thumbnail';
import { AbstractUseCase } from '../libs/UseCase';
import { FilesDataSource } from './contracts/FilesDataSource';
import { FilesService } from './FilesService';
import { EntityPermissionChecker } from '../domain/entity/EntityPermissionChecker';

type Output = Omit<fileDBO, '_id'> & { _id: string };

type Deps = {
  filesDS: FilesDataSource;
  filesService: FilesService;
  entityPermissions: EntityPermissionChecker;
};

const InputSchema = z.object({
  fileId: z.string(),
});

type Input = z.infer<typeof InputSchema>;

class FileDelete extends AbstractUseCase<Input, Output, Deps> {
  static InputSchema = InputSchema;

  async execute({ fileId }: Input): Promise<Output> {
    const file = (await this.deps.filesDS.getById(fileId)).getDataOrThrow();
    let thumbnails: Thumbnail[] = [];

    if (file instanceof ProcessedPDF) {
      thumbnails = await this.deps.filesDS.getThumbnails([file]).all();
    }

    if (
      !(
        await this.deps.entityPermissions.checkWritePermission(file, this.getActor())
      ).getDataOrThrow()
    ) {
      throw createError('file not found', 404);
    }

    await this.transactionManager.run(async () => {
      await this.deps.filesService.delete([file, ...thumbnails]);
    });

    return file.toDTO();
  }
}

export { FileDelete };
