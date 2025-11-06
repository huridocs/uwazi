import { AbstractUseCase } from 'api/core/libs/UseCase';
import { FileStorage } from 'api/files.v2/contracts/FileStorage';
import { CsvImportsDataSource } from '../contracts/CsvImportsDataSource';
import { RegisterCsvImportInput, RegisterCsvImportOutput } from '../types/RegisterCsvImport';

type Deps = {
  csvImportsDS: CsvImportsDataSource;
  fileStorage: FileStorage;
};

export class RegisterCsvImportUseCase extends AbstractUseCase<
  RegisterCsvImportInput,
  RegisterCsvImportOutput,
  Deps
> {
  protected async executeAsync(input: RegisterCsvImportInput): Promise<RegisterCsvImportOutput> {
    const now = Date.now();
    const { originalname: originalFilename, mimetype: mimeType, size } = input.file.metadata;
    const templateId = input.template;

    const { id: importId } = await this.deps.csvImportsDS.create({
      templateId,
      originalFilename,
      mimeType,
      size,
      status: 'queued',
      createdBy: input.userId,
      createdAt: now,
      updatedAt: now,
    });

    const destination = `csv-imports/${importId}`;
    await this.deps.fileStorage.storeFile({
      file: input.file.contents,
      type: 'customPath',
      destination,
    });

    await this.deps.csvImportsDS.setStorage(importId, {
      path: `${destination}/${input.file.contents.filename}`,
    });

    return {
      importId,
      status: 'queued',
      message: 'Import registered and queued for processing.',
    };
  }
}
