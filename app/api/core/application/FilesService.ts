import { ArrayUtils } from 'api/common.v2/utils/Array';
import { FilesDataSource } from 'api/core/application/contracts/FilesDataSource';
import { FileStorage } from 'api/core/application/contracts/FileStorage';
import { Attachment } from 'api/core/domain/files/Attachment';
import { Document } from 'api/core/domain/files/Document';
import { InputFile } from 'api/core/domain/files/InputFile';
import { ProcessedDocument } from 'api/core/domain/files/ProcessedDocument';
import { Thumbnail } from 'api/core/domain/files/Thumbnail';
import { UwaziFile } from 'api/core/domain/files/UwaziFile';
import date from 'api/utils/date';
import { LanguageISO6391 } from 'shared/types/commonTypes';
import { FileContentsIO } from '../infrastructure/files/FileContentIO';
import { PDFPostProcessJob } from '../infrastructure/jobs/PDFPostProcessJob';
import { PDFService } from '../infrastructure/services/PDFService';
import { JobsDispatcher } from '../libs/queue/application/contracts/JobsDispatcher';
import { IdGenerator } from './contracts/IdGenerator';
import { Result } from '../libs/Result';

type Deps = {
  idGenerator: IdGenerator;
  fileStorage: FileStorage;
  filesDS: FilesDataSource;
  jobsDispatcher: JobsDispatcher;
  pdfService: PDFService;
  filesIO: FileContentsIO;
};

function isNonEmptyArray<T>(arr: T[]): arr is [T, ...T[]] {
  return arr.length > 0;
}

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
    if (isNonEmptyArray<UwaziFile>(files)) {
      await this.deps.filesDS.bulkCreate(files);

      await this.deps.jobsDispatcher.dispatchMany(async dispatch => {
        files.forEach(file => {
          if (file instanceof Document) {
            dispatch(PDFPostProcessJob, {
              documentId: file.id,
            });
          }
        });
      });
    }
  }

  async createThumbnail(doc: ProcessedDocument, language: LanguageISO6391) {
    const thumbnailResult = await this.deps.pdfService.createThumbnail(doc.content);
    if (thumbnailResult.isError()) {
      return thumbnailResult;
    }
    const diskThumbnail = thumbnailResult.getData();
    return Result.ok(
      new Thumbnail({
        originalname: `${doc.id}.jpg`,
        filename: `${doc.id}.jpg`,
        mimetype: 'image/jpeg',
        size: (await this.deps.filesIO.size(diskThumbnail)).getDataOrThrow(),
        id: this.deps.idGenerator.generate(),
        entity: doc.entity,
        language,
        creationDate: date.currentUTC(),
        uploaded: true,
        content: diskThumbnail.toContent(),
      })
    );
  }
}

export { FilesService };
