import { AbstractUseCase } from 'api/core/libs/UseCase';
import { FileStorage } from 'api/files.v2/contracts/FileStorage';
import { JobsDispatcher } from 'api/core/libs/queue/application/contracts/JobsDispatcher';
import { tenants } from 'api/tenants/tenantContext';
import { InputFile } from 'api/files.v2/model/InputFile';
import { CsvImportsDataSource } from './application/contracts/CsvImportsDataSource';
import { CsvImportDomain } from './domain/CsvImport';
import { CsvExtractUploadedZipJobDispatcher } from './infrastructure/queue/CsvExtractUploadedZipJobDispatcher';

type Deps = {
  csvImportsDS: CsvImportsDataSource;
  fileStorage: FileStorage;
  jobsDispatcher: JobsDispatcher;
};

export type RegisterCsvImportInput = {
  template: string;
  file: InputFile;
  userId: string;
  sessionId?: string;
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
    const { filename } = input.file;
    await this.deps.fileStorage.storeContent(input.file.content, `${destination}/${filename}`);
    const csvImportWithStorage = CsvImportDomain.withStorage(
      csvImport,
      `${destination}/${filename}`
    );

    await this.transactionManager.run(async () => {
      await this.deps.csvImportsDS.insert(csvImportWithStorage);
      await this.deps.jobsDispatcher.dispatch(CsvExtractUploadedZipJobDispatcher, {
        tenantName: tenants.current().name,
        userId: input.userId,
        importId: id,
        sessionId: input.sessionId,
      });
    });

    return {
      id,
      status: 'queued',
      message: 'Import registered and queued for processing.',
    };
  }
}
