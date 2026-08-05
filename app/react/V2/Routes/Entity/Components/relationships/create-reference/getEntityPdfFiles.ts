import type { Entity } from '#V2/api/entities/types.js';
import type { FileType } from '#shared/types/fileType.js';

const getEntityPdfFiles = (entity: Entity): FileType[] =>
  [...(entity.documents ?? []), ...(entity.attachments ?? [])].filter(
    file => file.mimetype === 'application/pdf'
  );

export { getEntityPdfFiles };
