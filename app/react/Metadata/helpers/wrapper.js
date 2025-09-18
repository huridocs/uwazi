/* eslint-disable max-statements */
import { isString } from 'lodash';
import uniqueID from 'shared/uniqueID';
import { isValidUrl } from 'shared/urlValidationUtils';

const prepareFiles = async (mediaProperties, values) => {
  const metadataFiles = {};
  const entityAttachments = [];
  const files = [];

  if (values.metadata) {
    await Promise.all(
      mediaProperties.map(async p => {        
        if (!values.metadata[p.name] || /^https?:\/\//.test(values.metadata[p.name]) || /^blob:/.test(values.metadata[p.name])) {
          return Promise.resolve();
        }

        const metadataValue = values.metadata[p.name];

        // Skip if it's a simple URL string (from URL input)
        if (typeof metadataValue === 'string' && /^https?:\/\//.test(metadataValue)) {
          return Promise.resolve();
        }

        if (typeof metadataValue !== 'object' || !metadataValue.data) {
          return Promise.resolve();
        }

        const { data, originalFile } = metadataValue;
        if (originalFile) {
          if (originalFile instanceof File) {
            const fileID = uniqueID();
            metadataFiles[p.name] = fileID;

            entityAttachments.push({
              originalname: originalFile.name,
              filename: originalFile.name,
              type: 'attachment',
              mimetype: originalFile.type,
              fileLocalID: fileID,
            });

            files.push(originalFile);
            return Promise.resolve();
          }

          if (data instanceof File) {
            const fileID = uniqueID();
            metadataFiles[p.name] = fileID;

            entityAttachments.push({
              originalname: data.name,
              filename: data.name,
              type: 'attachment',
              mimetype: data.type,
              fileLocalID: fileID,
            });

            files.push(data);
            return Promise.resolve();
          }

          const validBlobUrlRegExp =
            /^\(?(blob:https?:\/\/(?:www\.)?[-a-zA-Z0-9+&@#/%?=~_|!:,.;]*[-a-zA-Z0-9+&@#/%=~_|])(, ({.+}))?/;

          const [, url, , timeLinks] = data.match(validBlobUrlRegExp) || ['', data];

          try {
            const blob = await fetch(url).then(r => r.blob());
            const file = new File([blob], originalFile.name, { type: blob.type });
            const fileID = uniqueID();

            metadataFiles[p.name] = fileID;

            entityAttachments.push({
              originalname: file.name,
              filename: file.name,
              type: 'attachment',
              mimetype: blob.type,
              fileLocalID: fileID,
              timeLinks,
            });

            files.push(file);
          } catch (error) {
            // Let the blob URL remain in metadata if processing fails
          }
        }
      })
    );
  }

  return { metadataFiles, entityAttachments, files };
};

function wrapEntityMetadata(entity, template) {
  const mediaProperties =
    template.properties?.filter(prop => prop.type === 'image' || prop.type === 'media') || [];

  if (!entity.metadata) {
    return { ...entity };
  }
  const newFileMetadataValues = (entity.attachments || [])
    .filter(attachment => attachment.fileLocalID)
    .reduce(
      (previousValue, attachment, index) => ({
        ...previousValue,
        [attachment.fileLocalID]: { value: '', attachment: index, timeLinks: attachment.timeLinks },
      }),
      {}
    );

  const metadata = Object.keys(entity.metadata).reduce((wrappedMo, key) => {
    let timeLinks;
    const property = mediaProperties.find(p => p.name === key);
    const fieldValue = entity.metadata[key]?.data || entity.metadata[key];
    
    if (property && (property.type === 'image' || property.type === 'media')) {
      if (typeof fieldValue === 'string' && fieldValue.startsWith('blob:')) {
        return { ...wrappedMo, [key]: [{ value: '' }] };
      }
      if (typeof fieldValue === 'object' && fieldValue.data && fieldValue.data.startsWith('blob:')) {
        return { ...wrappedMo, [key]: [{ value: '' }] };
      }
    }
    
    let fileLocalID = fieldValue;
    if (property && entity.metadata[key] && property.type === 'media') {
      const uniqueIdTimeLinksExp = /^\(?([\w+]{5,15})(, ({.+})\))?|$/;
      const mediaExpGroups = fieldValue.match(uniqueIdTimeLinksExp);
      if (isString(fieldValue) && mediaExpGroups && mediaExpGroups[1]) {
        [, fileLocalID = fieldValue, , timeLinks] = mediaExpGroups || [];
      }
      if (fileLocalID && fileLocalID.length < 20 && timeLinks) {
        newFileMetadataValues[fileLocalID] = { ...newFileMetadataValues[fileLocalID], timeLinks };
      }
    }

    const metadataValue = newFileMetadataValues[fileLocalID];
    return {
      ...wrappedMo,
      [key]: Array.isArray(entity.metadata[key])
        ? entity.metadata[key].map(v => ({ value: v }))
        : [metadataValue || { value: entity.metadata[key]?.data || entity.metadata[key] }],
    };
  }, {});

  return { ...entity, metadata };
}

const prepareMetadataAndFiles = async (values, attachedFiles, template, mediaProperties) => {
  const { metadataFiles, entityAttachments, files } = await prepareFiles(mediaProperties, values);
  const fields = { ...values.metadata, ...metadataFiles };
  const entity = { ...values, metadata: fields, attachments: entityAttachments };
  const wrappedEntity = wrapEntityMetadata(entity, template);
  wrappedEntity.file = values.file ? values.file[0] : undefined;
  wrappedEntity.attachments = [];
  wrappedEntity.attachments.push(...files);
  wrappedEntity.attachments.push(...attachedFiles);
  return { ...wrappedEntity, template: template._id };
};

export { prepareMetadataAndFiles, wrapEntityMetadata };
