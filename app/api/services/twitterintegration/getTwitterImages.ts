/* eslint-disable max-statements */
import { Readable } from 'stream';
import mime from 'mime-types';
import { ResultsMessage } from '#api/services/tasksmanager/TaskManager.js';
import { EntitySchema } from '#shared/types/entityType.js';
import { generateFileName, storage } from '#api/files/index.js';
import { FileAttachment } from '#api/core/domain/files/FileAttachment.js';
import { FileContents } from '#api/core/domain/files/FileContents.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { IdGeneratorFactory } from '#api/core/infrastructure/factories/IdGeneratorFactory.js';
import { FilesServiceFactory } from '#api/core/infrastructure/factories/FilesServiceFactory.js';

interface TwitterImageData {
  fileName: string;
  url: string;
}

const getTwitterImages = async (entity: EntitySchema, imagesFileNamesUrls: TwitterImageData[]) => {
  const attachments: FileAttachment[] = [];
  const idGenerator = IdGeneratorFactory.default();

  for (let i = 0; i < imagesFileNamesUrls.length; i += 1) {
    const twitterImageData = imagesFileNamesUrls[i];
    // eslint-disable-next-line no-await-in-loop
    const fileResponse = await fetch(twitterImageData.url);
    const fileStream = fileResponse.body as unknown as Readable;
    if (!fileStream) {
      throw new Error(`Error requesting for twitter image: ${twitterImageData.url}`);
    }

    // eslint-disable-next-line no-await-in-loop
    await storage.storeFile(twitterImageData.fileName, fileStream, 'attachment');

    attachments.push(
      new FileAttachment({
        id: idGenerator.generate(),
        filename: twitterImageData.fileName,
        originalname: twitterImageData.url.split('/').slice(-1)[0],
        size: 0,
        entity: entity.sharedId!,
        mimetype: mime.lookup(twitterImageData.fileName) || 'application/octet-stream',
        content: new FileContents(async function* () {}),
      })
    );
  }

  const filesService = FilesServiceFactory.default();

  await ExecutionContext.transactionManager.run(async () => filesService.insert(attachments));
};

const getTextWithAttachedImages = (
  message: ResultsMessage,
  imagesFileNamesUrls: TwitterImageData[]
) => {
  let textWithImagesInAttachments = message.params?.text;

  for (let i = 0; i < imagesFileNamesUrls.length; i += 1) {
    const twitterImageData = imagesFileNamesUrls[i];
    textWithImagesInAttachments = textWithImagesInAttachments.replace(
      twitterImageData.url,
      `/api/files/${twitterImageData.fileName}`
    );
  }

  return textWithImagesInAttachments;
};

const getTwitterImagesData = (message: ResultsMessage) =>
  message.params?.images_urls
    ? message.params?.images_urls.map((url: string) => ({
        fileName: generateFileName({
          originalname: url.split('/').slice(-1)[0],
        }),
        url,
      }))
    : [];

export { getTwitterImages, getTextWithAttachedImages, getTwitterImagesData };
export type { TwitterImageData };
