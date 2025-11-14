import { ArrayUtils } from 'api/common.v2/utils/Array';
import { FilesDataSource } from 'api/files.v2/contracts/FilesDataSource';
import { FileStorage } from 'api/files.v2/contracts/FileStorage';
import { Attachment } from 'api/files.v2/model/Attachment';
import { Document } from 'api/files.v2/model/Document';
import { InputFile } from 'api/files.v2/model/InputFile';
import { UwaziFile } from 'api/files.v2/model/UwaziFile';
import { permissionsContext } from 'api/permissions/permissionsContext';
import { tenants } from 'api/tenants';
import date from 'api/utils/date';
import { PDFPostProcessJob } from '../infrastructure/jobs/PDFPostProcessJob';
import { JobsDispatcher } from '../libs/queue/application/contracts/JobsDispatcher';
import { IdGenerator } from './contracts/IdGenerator';

type Deps = {
  idGenerator: IdGenerator;
  fileStorage: FileStorage;
  filesDS: FilesDataSource;
  jobsDispatcher: JobsDispatcher;
};

class FilesService {
  constructor(protected deps: Deps) {}

  async fromInputFiles(entity: string, input: InputFile[]): Promise<(Document | Attachment)[]> {
    return input.map(inputFile => {
      if (inputFile.isAttachment()) {
        return new Attachment({
          entity,
          id: this.deps.idGenerator.generate(),
          ...inputFile.metadata,
          filename: inputFile.filename,
          uploaded: true,
          creationDate: date.currentUTC(),
          content: inputFile.content,
        });
      }
      return new Document({
        entity,
        id: this.deps.idGenerator.generate(),
        ...inputFile.metadata,
        filename: inputFile.filename,
        uploaded: true,
        status: 'processing',
        creationDate: date.currentUTC(),
        content: inputFile.content,
      });
    });
  }

  async storeFiles(files: UwaziFile[]) {
    await ArrayUtils.sequentialFor(files, async file => {
      await this.deps.fileStorage.storeFile(file);
    });
  }

  async insert(files: UwaziFile[]) {
    const { _id: userId } = permissionsContext.getUserInContext()!;
    if (!userId) {
      throw new Error('No user in context !');
    }

    await this.deps.filesDS.bulkCreate(files);

    await this.deps.jobsDispatcher.dispatchMany(async dispatch => {
      files.forEach(file => {
        if (file instanceof Document) {
          dispatch(PDFPostProcessJob, {
            documentId: file.id,
            userId: userId.toString(),
            tenantName: tenants.current().name,
          });
        }
      });
    });
  }
}

export { FilesService };
