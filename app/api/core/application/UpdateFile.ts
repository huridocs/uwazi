import { createError } from '#api/utils/index.js';
import { EntityPermissionChecker } from '../domain/entityAccessPolicy/EntityPermissionChecker.js';
import { AbstractUseCase } from '../libs/UseCase.js';
import { FilesDataSource } from './contracts/FilesDataSource.js';
import { FilesService } from './FilesService.js';
import { BaseFile } from '../domain/files/BaseFile.js';
import { LanguageISO6391, PropertySelectionSchema } from '#shared/types/commonTypes.js';
import { TableOfContent } from '../domain/files/domainTypes.js';

type Input = {
  fileId: string;
  originalname?: string;
  language?: LanguageISO6391;
  toc?: TableOfContent[];
  url?: string;
  propertySelections?: PropertySelectionSchema[];
};
type Output = BaseFile;

type Deps = {
  filesDS: FilesDataSource;
  filesService: FilesService;
  entityPermissions: EntityPermissionChecker;
};

class UpdateFile extends AbstractUseCase<Input, Output, Deps> {
  async execute({ fileId, ...input }: Input): Promise<Output> {
    const file = (await this.deps.filesDS.getById(fileId)).getDataOrThrow();

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
      toc: input.toc,
      propertySelections: input.propertySelections,
      url: input.url,
    });

    await this.transactionManager.run(async () => this.deps.filesService.bulkUpsert([updatedFile]));

    return updatedFile;
  }
}

export type { Input as UpdateFileInput, Deps as UpdateFileDeps };
export { UpdateFile };
