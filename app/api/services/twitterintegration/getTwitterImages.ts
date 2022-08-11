import { ResultsMessage } from 'api/services/tasksmanager/TaskManager';
import { EntitySchema } from 'shared/types/entityType';
import { Readable } from 'stream';
import { files, generateFileName, storage } from 'api/files';

interface TwitterImageData {
  fileName: string;
  url: string;
}

const saveImage = async (twitterImageData: TwitterImageData, entity: EntitySchema) => {
  const fileResponse = await fetch(twitterImageData.url);
  const fileStream = fileResponse.body as unknown as Readable;
  if (!fileStream) {
    throw new Error(`Error requesting for twitter image: ${twitterImageData.url}`);
  }

  await storage.storeFile(twitterImageData.fileName, fileStream, 'attachment');
  await files.save({
    entity: entity.sharedId,
    filename: twitterImageData.fileName,
    originalname: twitterImageData.url.split('/').slice(-1)[0],
    type: 'attachment',
  });
};

const getTwitterImages = async (entity: EntitySchema, imagesFileNamesUrls: TwitterImageData[]) => {
  for (let i = 0; i < imagesFileNamesUrls.length; i += 1) {
    const twitterImageData = imagesFileNamesUrls[i];
    // eslint-disable-next-line no-await-in-loop
    await saveImage(twitterImageData, entity);
  }
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

const getTwitterImagesData = (message: ResultsMessage) => {
  return message.params?.images_urls
    ? message.params?.images_urls.map((url: string) => ({
        fileName: generateFileName({
          originalname: url.split('/').slice(-1)[0],
        }),
        url: url,
      }))
    : [];
};

export { getTwitterImages, getTextWithAttachedImages, getTwitterImagesData };
export type { TwitterImageData };
