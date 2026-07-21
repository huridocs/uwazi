import { z } from 'zod';
import { FileDTO } from '#api/core/domain/files/domainTypes.js';
import { EntitiesDataSource } from '#api/core/application/contracts/EntitiesDataSource.js';
import { createError } from '#api/utils/index.js';
import { EntityPermissionChecker } from '../domain/entityAccessPolicy/EntityPermissionChecker.js';
import { PDFDocument } from '../domain/files/PDFDocument.js';
import { AbstractUseCase } from '../libs/UseCase.js';
import { FilesDataSource } from './contracts/FilesDataSource.js';
import { SettingsDataSource } from './contracts/SettingsDataSource.js';
import { EntitiesService } from './EntitiesService.js';
import { FilesService } from './FilesService.js';

type Output = FileDTO;

type Deps = {
  filesDS: FilesDataSource;
  filesService: FilesService;
  entityPermissions: EntityPermissionChecker;
  entitiesDS: EntitiesDataSource;
  entitiesService: EntitiesService;
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

    if (
      !(
        await this.deps.entityPermissions.checkWritePermission(file, this.getActor())
      ).getDataOrThrow()
    ) {
      throw createError('file not found', 404);
    }

    await this.transactionManager.run(async () => {
      await this.deps.filesService.delete([file]);

      if (file instanceof PDFDocument && file.isReady()) {
        const entity = (await this.deps.entitiesDS.getById(file.entity)).getDataOrThrow();

        const allThumbnails = await this.deps.filesDS.getThumbnails([entity.sharedId]);
        const survivingThumbnails = allThumbnails.filter(t => t.filename !== `${file.id}.jpg`);

        entity.setPreview(survivingThumbnails, await this.deps.settingsDS.getDefaultLanguageKey());

        await this.deps.entitiesService.update([entity], {
          actorId: this.actorId,
          actor: this.getActor(),
          targetLanguage: entity.languages[0],
        });
      }
    });

    return file.toDTO();
  }
}

export { FileDelete };
export type { Deps as DeleteFileDeps };
