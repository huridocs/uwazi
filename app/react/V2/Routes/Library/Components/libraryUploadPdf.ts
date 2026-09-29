import { UploadService } from '#V2/api/files/UploadService.js';
import type { Entity } from '#V2/api/entities/types.js';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object';

const entityFromCreatePdfResponse = (response: unknown): Entity | undefined => {
  if (!isRecord(response)) {
    return undefined;
  }
  const nested = response.data;
  if (isRecord(nested) && typeof nested.sharedId === 'string') {
    return nested as unknown as Entity;
  }
  if (typeof response.sharedId === 'string') {
    return response as unknown as Entity;
  }
  return undefined;
};

const uploadPdfsAndCreateEntities = async (
  files: File[],
  onProgress: (percent: number, filename: string) => void,
  onFileComplete: () => void
) => {
  const service = new UploadService('createFromPDF');
  service.onProgress((filename, percent) => onProgress(percent, filename));
  service.onUploadComplete(() => onFileComplete());
  const responses = await service.upload(files);
  return responses
    .map(entityFromCreatePdfResponse)
    .filter((entity): entity is Entity => Boolean(entity));
};

export { entityFromCreatePdfResponse, uploadPdfsAndCreateEntities };
