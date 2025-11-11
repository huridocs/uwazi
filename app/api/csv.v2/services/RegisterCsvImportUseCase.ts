import { AbstractUseCase } from 'api/core/libs/UseCase';
import { FileStorage } from 'api/files.v2/contracts/FileStorage';
import { CsvImportsDataSource } from '../contracts/CsvImportsDataSource';
import { CsvImportDomain } from '../model/CsvImport';
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
    const { originalname: originalFilename, mimetype: mimeType, size } = input.file.metadata;
    const templateId = input.template;

    const id = this.idGenerator.generate();
    const csvImport = CsvImportDomain.create({
      id,
      templateId,
      file: { originalName: originalFilename, mimeType, size },
      createdBy: input.userId,
    });

    const destination = `csv-imports/${id}`;
    await this.deps.fileStorage.storeFile({
      file: input.file.contents,
      type: 'customPath',
      destination,
    });

    const { filename } = input.file.contents;
    const csvImportWithStorage = CsvImportDomain.withStorage(
      csvImport,
      `${destination}/${filename}`
    );

    await this.transactionManager.run(async () => {
      await this.deps.csvImportsDS.insert(csvImportWithStorage);
    });

    return {
      id,
      status: 'queued',
      message: 'Import registered and queued for processing.',
    };
  }
}
