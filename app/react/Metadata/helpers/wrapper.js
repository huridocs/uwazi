/* eslint-disable max-statements */
import { isString } from 'lodash';
import uniqueID from 'shared/uniqueID';

const isMediaProperty = property => {
  return property && (property.type === 'image' || property.type === 'media');
};

const shouldSkipValue = fieldValue => {
  if (fieldValue === null || fieldValue === undefined) {
    return true;
  }
  if (typeof fieldValue === 'string' && fieldValue.startsWith('blob:')) {
    return true;
  }

  if (
    typeof fieldValue === 'object' &&
    fieldValue &&
    fieldValue.data &&
    fieldValue.data.startsWith('blob:') &&
    (fieldValue.originalFile === null ||
      fieldValue.originalFile === undefined ||
      !fieldValue.originalFile)
  ) {
    return true;
  }

  return false;
};

const prepareFiles = async (mediaProperties, values) => {
  const metadataFiles = {};
  const entityAttachments = [];
  const files = [];

  if (values.metadata) {
    await Promise.all(
      mediaProperties.map(async p => {
        if (!values.metadata[p.name]) {
          return Promise.resolve();
        }

        const metadataValue = values.metadata[p.name];
        if (shouldSkipValue(metadataValue)) {
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

          if (!url || url === data) {
            if (originalFile && originalFile instanceof File && originalFile.size > 0) {
              const fileID = uniqueID();
              metadataFiles[p.name] = fileID;

              entityAttachments.push({
                originalname: originalFile.name,
                filename: originalFile.name,
                type: 'attachment',
                mimetype: originalFile.type,
                fileLocalID: fileID,
                timeLinks,
              });

              files.push(originalFile);
            }
            return Promise.resolve();
          }

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
            // Fallback: If blob URL processing fails, process originalFile directly
            if (originalFile && originalFile instanceof File && originalFile.size > 0) {
              const fileID = uniqueID();
              metadataFiles[p.name] = fileID;

              entityAttachments.push({
                originalname: originalFile.name,
                filename: originalFile.name,
                type: 'attachment',
                mimetype: originalFile.type,
                fileLocalID: fileID,
                timeLinks,
              });

              files.push(originalFile);
            }
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

    if (isMediaProperty(property) && shouldSkipValue(fieldValue)) {
      return { ...wrappedMo, [key]: [{ value: '' }] };
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

  // Remove blob URLs from metadata before passing to wrapEntityMetadata
  const cleanedMetadata = { ...values.metadata };
  Object.keys(cleanedMetadata).forEach(key => {
    if (cleanedMetadata[key]) {
      const metadataValue = cleanedMetadata[key];
      if (shouldSkipValue(metadataValue)) {
        cleanedMetadata[key] = '';
      }
    }
  });

  const fields = { ...cleanedMetadata, ...metadataFiles };
  const entity = { ...values, metadata: fields, attachments: entityAttachments };
  const wrappedEntity = wrapEntityMetadata(entity, template);
  wrappedEntity.file = values.file ? values.file[0] : undefined;
  wrappedEntity.attachments = [];
  wrappedEntity.attachments.push(...files);
  wrappedEntity.attachments.push(...attachedFiles);
  return { ...wrappedEntity, template: template._id };
};

export { prepareMetadataAndFiles, wrapEntityMetadata };
