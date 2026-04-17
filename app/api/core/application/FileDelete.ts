import { fileDBO } from '#api/core/infrastructure/mongodb/files/schemas/filesTypes.js';
import { MultiLanguageEntityDataSource } from '#api/entities.v2/contracts/MultiLanguageEntitiesDataSource.js';
import { createError } from '#api/utils/index.js';
import { z } from 'zod';
import { EntityPermissionChecker } from '../domain/entity/EntityPermissionChecker.js';
import { ProcessedPDF } from '../domain/files/ProcessedPDF.js';
import { Thumbnail } from '../domain/files/Thumbnail.js';
import { AbstractUseCase } from '../libs/UseCase.js';
import { FilesDataSource } from './contracts/FilesDataSource.js';
import { SettingsDataSource } from './contracts/SettingsDataSource.js';
import { FilesService } from './FilesService.js';

type Output = Omit<fileDBO, '_id'> & { _id: string };

type Deps = {
  filesDS: FilesDataSource;
  filesService: FilesService;
  entityPermissions: EntityPermissionChecker;
  entitiesDS: MultiLanguageEntityDataSource;
  settingsDS: SettingsDataSource;
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
      thumbnails = await this.deps.filesDS.getThumbnails([file.entity]).all();
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

      if (file instanceof ProcessedPDF) {
        const entity = (await this.deps.entitiesDS.getById(file.entity)).getDataOrThrow();

        entity.setPreview(
          await this.deps.filesDS.getThumbnails([entity.sharedId]).all(),
          await this.deps.settingsDS.getDefaultLanguageKey()
        );

        await this.deps.entitiesDS.update(entity);
      }
    });

    return file.toDTO();
  }
}

export { FileDelete };
