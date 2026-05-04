import { Entity } from '#V2/api/entities/types.js';
import { ClientTemplateSchema } from '#V2/shared/types.js';
import { getMimetypeFromUrl } from '#V2/shared/formatHelpers.js';
import { EntityFile } from '../types';
import { getMainDocument } from './getMainDocument';

const formatEntityFiles = (
  entity: Entity,
  templates: ClientTemplateSchema[],
  locale: string
): EntityFile[] => {
  const entityTemplate = templates.find(template => template._id === entity.template);

  if (!entity || !entityTemplate) {
    return [];
  }

  const ownFileProperties = (entityTemplate.properties || []).filter(
    p => p.type === 'image' || p.type === 'media'
  );

  const metadataFiles: EntityFile[] = ownFileProperties.flatMap(property => {
    const value = entity.metadata?.[property.name]?.[0]?.value as string | undefined;

    if (!value || value.startsWith('http://') || value.startsWith('https://')) {
      return [];
    }

    const filename = value.split('/').pop() || '';
    const mimetype = getMimetypeFromUrl(value);

    return [{ fileType: property.type as 'image' | 'media', file: { filename, mimetype } }];
  });

  const mainDocument = getMainDocument(entity.documents, locale);

  const documents: EntityFile[] = (entity.documents || []).map(doc => ({
    fileType: doc._id === mainDocument?._id ? 'mainDocument' : 'document',
    file: doc,
  }));

  const attachments: EntityFile[] = (entity.attachments || []).map(attachment => ({
    fileType: attachment.url ? 'externalURL' : 'attachment',
    file: attachment,
  }));

  return [...metadataFiles, ...documents, ...attachments];
};

export { formatEntityFiles };
