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

    const importId = await this.transactionManager.run(async () => {
      const id = this.idGenerator.generate();
      const domain = CsvImportDomain.create({
        id,
        templateId,
        file: { originalName: originalFilename, mimeType, size },
        createdBy: input.userId,
      });
      await this.deps.csvImportsDS.insert(domain);

      const destination = `csv-imports/${id}`;
      await this.deps.fileStorage.storeFile({
        file: input.file.contents,
        type: 'customPath',
        destination,
      });

      const { filename } = input.file.contents;
      const updated = CsvImportDomain.withStorage(domain, `${destination}/${filename}`);
      await this.deps.csvImportsDS.update(updated);

      return id;
    });

    return {
      importId,
      status: 'queued',
      message: 'Import registered and queued for processing.',
    };
  }
}
