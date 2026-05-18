import { createError } from '#api/utils/index.js';
import { z } from 'zod';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { fileDTO } from '#api/core/infrastructure/mongodb/files/schemas/filesTypes.js';
import { EntityPermissionChecker } from '../domain/entityAccessPolicy/EntityPermissionChecker.js';
import { AbstractUseCase } from '../libs/UseCase.js';
import { FilesDataSource } from './contracts/FilesDataSource.js';
import { FilesService } from './FilesService.js';
import { BaseFile } from '../domain/files/BaseFile.js';

const InputSchema = z.object({
  fileId: z.string().min(1),
  originalname: z.string().optional(),
  language: z.string().optional() as z.ZodType<LanguageISO6391 | undefined>,
});

type Input = z.infer<typeof InputSchema>;
type Output = BaseFile;

type Deps = {
  filesDS: FilesDataSource;
  filesService: FilesService;
  entityPermissions: EntityPermissionChecker;
};

class UpdateFile extends AbstractUseCase<Input, Output, Deps> {
  static InputSchema = InputSchema;

  async execute(input: Input): Promise<Output> {
    const file = (await this.deps.filesDS.getById(input.fileId)).getDataOrThrow();

    if (
      !(
        await this.deps.entityPermissions.checkWritePermission(file, this.getActor())
      ).getDataOrThrow()
    ) {
      throw createError('file not found', 404);
    }

    const updatedFile = file.update({
      originalname: input.originalname,
      language: input.language,
    });

    await this.transactionManager.run(async () => this.deps.filesService.bulkUpsert([updatedFile]));

    return updatedFile;
  }
}

export type { Input as UpdateFileInput, Deps as UpdateFileDeps };
export { UpdateFile };
