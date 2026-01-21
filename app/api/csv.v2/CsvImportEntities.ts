import { AbstractUseCase } from '#api/core/libs/UseCase.js';
import { FileStorage } from '#api/core/application/contracts/FileStorage.js';
import { JobsDispatcher } from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';
import { tenants } from '#api/tenants/tenantContext.js';
import { InputFile } from '#api/core/infrastructure/files/InputFile.js';
import { CsvImportsDataSource } from '#api/csv.v2/application/contracts/CsvImportsDataSource.js';
import { CsvImportDomain } from '#api/csv.v2/domain/CsvImport.js';
import { CsvExtractUploadedZipJobHandler } from '#api/csv.v2/infrastructure/jobHandlers/CsvExtractUploadedZipJobHandler.js';
import { tenants } from '#api/tenants/index.js';

type Deps = {
  csvImportsDS: CsvImportsDataSource;
  fileStorage: FileStorage;
  jobsDispatcher: JobsDispatcher;
};

export type RegisterCsvImportInput = {
  template: string;
  file: InputFile;
  userId: string;
};

export type RegisterCsvImportOutput = {
  id: string;
  status: 'queued';
  message: string;
};

export class CsvImportEntities extends AbstractUseCase<
  RegisterCsvImportInput,
  RegisterCsvImportOutput,
  Deps
> {
  async execute(input: RegisterCsvImportInput): Promise<RegisterCsvImportOutput> {
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
    const { filename } = input.file;
    await this.deps.fileStorage.storeContent(input.file.content, `${destination}/${filename}`);
    const csvImportWithStorage = CsvImportDomain.withStorage(
      csvImport,
      `${destination}/${filename}`
    );

    await this.transactionManager.run(async () => {
      await this.deps.csvImportsDS.insert(csvImportWithStorage);
      await this.deps.jobsDispatcher.dispatch(CsvExtractUploadedZipJobHandler, {
        tenantName: tenants.current().name,
        userId: input.userId,
        importId: id,
      });
    });

    return {
      id,
      status: 'queued',
      message: 'Import registered and queued for processing.',
    };
  }
}
