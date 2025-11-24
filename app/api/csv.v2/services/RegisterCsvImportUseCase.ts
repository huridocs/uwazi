import { AbstractUseCase } from 'api/core/libs/UseCase';
import { FileStorage } from 'api/core/application/contracts/FileStorage';
import { JobsDispatcher } from 'api/core/libs/queue/application/contracts/JobsDispatcher';
import { tenants } from 'api/tenants/tenantContext';
import { CsvImportsDataSource } from '../contracts/CsvImportsDataSource';
import { CsvImportDomain } from '../model/CsvImport';
import { RegisterCsvImportInput, RegisterCsvImportOutput } from '../types/RegisterCsvImport';
import { CsvExtractUploadedZipJob } from '../jobs/CsvExtractUploadedZipJob';

type Deps = {
  csvImportsDS: CsvImportsDataSource;
  fileStorage: FileStorage;
  jobsDispatcher: JobsDispatcher;
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
    const { filename } = input.file;
    await this.deps.fileStorage.storeContent(input.file.content, `${destination}/${filename}`);
    const csvImportWithStorage = CsvImportDomain.withStorage(
      csvImport,
      `${destination}/${filename}`
    );

    this.transactionManager.onCommitted(async () => {
      await this.deps.jobsDispatcher.dispatch(CsvExtractUploadedZipJob, {
        tenantName: tenants.current().name,
        userId: input.userId,
        importId: id,
        sessionId: input.sessionId,
      });
    });

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
