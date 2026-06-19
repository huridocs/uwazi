import { AbstractUseCase } from '../libs/UseCase.js';
import { FilesService } from './FilesService.js';
import { URLAttachment } from '../domain/files/URLAttachment.js';
import { mimeTypeFromUrl } from '#api/files/extensionHelper.js';
import { generateFileName } from '#api/files/filesystem.js';

type Input = {
  url: string;
  entityId: string;
  originalname?: string;
};

type Output = URLAttachment;

type Deps = {
  filesService: FilesService;
};

class CreateFileFromURL extends AbstractUseCase<Input, Output, Deps> {
  async execute({ entityId, url, originalname }: Input): Promise<Output> {
    const mimetype = mimeTypeFromUrl(url);

    const urlAttachment = new URLAttachment({
      id: this.idGenerator.generate(),
      entity: entityId,
      url,
      originalname,
      filename: generateFileName({ mimetype, originalname }),
      mimetype,
    });

    await this.transactionManager.run(async () => this.deps.filesService.insert([urlAttachment]));

    return urlAttachment;
  }
}

export type { Input as CreateFileFromURLInput, Deps as CreateFileFromURLDeps };
export { CreateFileFromURL };
