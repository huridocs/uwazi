import { InputFile } from 'api/core/infrastructure/files/InputFile';
import { FilesDataSource } from 'api/core/application/contracts/FilesDataSource';
import { FileStorage } from 'api/core/application/contracts/FileStorage';
import { FileCreatedEvent } from 'api/files/events/FileCreatedEvent';
import { CustomDTO } from 'api/core/infrastructure/mongodb/files/schemas/filesTypes';
import { ObjectId } from 'mongodb';
import { z } from 'zod';
import { AbstractUseCase } from 'api/core/libs/UseCase';

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

    await this.transactionManager.run(async () => {
      await this.deps.filesDS.create(file);
    });

    const dto = file.toDTO();

    await this.eventBus.emit(
      new FileCreatedEvent({ newFile: { ...dto, _id: new ObjectId(dto._id) } })
    );

    return dto;
  }
}
