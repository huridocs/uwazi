import { parseMediaSourceUrl } from '#shared/entitySave/mediaMetadata.js';
import { Entity } from '#V2/api/entities/types.js';
import { ClientTemplateSchema } from '#V2/shared/types.js';
import { getMimetypeFromUrl } from '#V2/shared/formatHelpers.js';
import { EntityFile } from '../types.js';
import { getMainDocument } from './getMainDocument.js';

const formatEntityFiles = (
  entity: Entity,
  templates: ClientTemplateSchema[],
  locale: string,
  defaultLanguage?: string
): EntityFile[] => {
  const entityTemplate = templates.find(template => template._id === entity.template);

  if (!entity || !entityTemplate) {
    return [];
  }

  const ownFileProperties = (entityTemplate.properties || []).filter(
    p => p.type === 'image' || p.type === 'media'
  );

  const mainDocument = getMainDocument(entity.documents, locale, defaultLanguage);

  const documents: EntityFile[] = (entity.documents || []).map(doc => ({
    fileType: doc._id === mainDocument?._id ? 'mainDocument' : 'document',
    file: doc,
  }));

  const attachments: EntityFile[] = (entity.attachments || []).map(attachment => ({
    fileType: attachment.url ? 'externalURL' : 'attachment',
    file: attachment,
  }));

  const knownFilenames = new Set(
    [...documents, ...attachments]
      .map(({ file }) => file.filename)
      .filter((filename): filename is string => Boolean(filename))
  );

  const metadataFiles: EntityFile[] = ownFileProperties.flatMap(property => {
    const value = entity.metadata?.[property.name]?.[0]?.value as string | undefined;

    if (!value) {
      return [];
    }

    const fileUrl = parseMediaSourceUrl(value);

    if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
      return [];
    }

    const filename = fileUrl.split('/').pop() || '';
    if (!filename || knownFilenames.has(filename)) {
      return [];
    }

    return [
      {
        fileType: property.type as 'image' | 'media',
        file: { filename, mimetype: getMimetypeFromUrl(fileUrl) },
      },
    ];
  });

  return [...metadataFiles, ...documents, ...attachments];
};

const countEntityFiles = (
  entity: Entity,
  templates: ClientTemplateSchema[],
  locale: string,
  defaultLanguage?: string
) => formatEntityFiles(entity, templates, locale, defaultLanguage).length;

export { formatEntityFiles, countEntityFiles };
