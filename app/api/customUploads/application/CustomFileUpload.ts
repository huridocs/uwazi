import { ObjectId } from 'mongodb';
import { z } from 'zod';
import { InputFile } from '#api/core/infrastructure/files/InputFile.js';
import { FilesDataSource } from '#api/core/application/contracts/FilesDataSource.js';
import { FileStorage } from '#api/core/application/contracts/FileStorage.js';
import { FileCreatedEvent } from '#api/core/domain/files/events/FileCreatedEvent.js';
import { FileCreatedEvent as V1FileCreatedEvent } from '#api/files/events/FileCreatedEvent.js';
import { CustomDTO } from '#api/core/infrastructure/mongodb/files/schemas/FilesTypes.js';
import { AbstractUseCase } from '#api/core/libs/UseCase.js';

type Deps = {
  filesDS: FilesDataSource;
  fileStorage: FileStorage;
};

const customFileUploadInputSchema = z.object({
  uploadedFile: z.instanceof(InputFile),
});

type Input = z.infer<typeof customFileUploadInputSchema>;

export class CustomFileUpload extends AbstractUseCase<Input, CustomDTO, Deps> {
  static inputSchema = customFileUploadInputSchema;

  async execute({ uploadedFile }: Input): Promise<CustomDTO> {
    const file = uploadedFile.toCustomFile(this.idGenerator.generate());

    await this.deps.fileStorage.storeFile(file);

    const dto = file.toDTO();

    await this.transactionManager.run(async () => {
      await this.deps.filesDS.create(file);
      await this.eventEmitter.emit(new FileCreatedEvent({ file: dto }));
    });

    await this.eventBus.emit(
      new V1FileCreatedEvent({ newFile: { ...dto, _id: new ObjectId(dto._id) } })
    );

    return dto;
  }
}
