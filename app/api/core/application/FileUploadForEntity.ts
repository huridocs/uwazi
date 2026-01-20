// eslint-disable-next-line node/no-restricted-import
import { InputFile } from '#api/core/infrastructure/files/InputFile.js';
import { fileDBO } from '#api/core/infrastructure/mongodb/files/schemas/filesTypes.js';
import { MultiLanguageEntityDataSource } from '#api/entities.v2/contracts/MultiLanguageEntitiesDataSource.js';
import { FileCreatedEvent } from '#api/files/events/FileCreatedEvent.js';
import { ObjectId } from 'mongodb';
import { z } from 'zod';
import { AbstractUseCase } from '#api/core/libs/UseCase.js';
import { FilesService } from '#api/core/application/FilesService.js';
import { EntityNotFoundError } from '#api/core/application/errors.js';

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

    const document = uploadedFile.toEntityFile(entityId, this.idGenerator.generate());

    await this.deps.filesService.storeFiles([document]);

    await this.transactionManager.run(async () => {
      await this.deps.filesService.insert([document]);
    });

    const dto = document.toDTO();
    await this.eventBus.emit(
      new FileCreatedEvent({ newFile: { ...dto, _id: new ObjectId(dto._id) } })
    );
    return dto;
  }
}
