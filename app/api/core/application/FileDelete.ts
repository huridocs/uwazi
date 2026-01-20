import { fileDBO } from '#api/core/infrastructure/mongodb/files/schemas/filesTypes.js';
import { z } from 'zod';
import { ProcessedPDF } from '#api/core/domain/files/ProcessedPDF.js';
import { Thumbnail } from '#api/core/domain/files/Thumbnail.js';
import { AbstractUseCase } from '#api/core/libs/UseCase.js';
import { FilesDataSource } from '#api/core/application/contracts/FilesDataSource.js';
import { FilesService } from '#api/core/application/FilesService.js';
import { EntityPermissionChecker } from '#api/core/domain/entity/EntityPermissionChecker.js';
import { createError } from '#api/utils/index.js';

type Output = Omit<fileDBO, '_id'> & { _id: string };

type Deps = {
  filesDS: FilesDataSource;
  filesService: FilesService;
  entityPermissions: EntityPermissionChecker;
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
