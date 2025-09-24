// @ts-expect-error TS(2307): Cannot find module '../services/tasksmanager/TaskM... Remove this comment to see the full error message
import { ResultsMessage } from '../services/tasksmanager/TaskManager.js';
// @ts-expect-error TS(2307): Cannot find module '../../shared/types/entityType.... Remove this comment to see the full error message
import { EntitySchema } from 'shared/types/entityType.js';
import { Readable } from 'stream';
// @ts-expect-error TS(2307): Cannot find module '../files.js' or its correspond... Remove this comment to see the full error message
import { files, generateFileName, storage } from '../files.js';

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
