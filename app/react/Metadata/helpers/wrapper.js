import uniqueID from 'shared/uniqueID';

const prepareFiles = async (mediaProperties, values) => {
  const metadataFiles = {};
  const entityAttachments = [];
  const files = [];

  if (values.metadata || mediaProperties.length === 0) {
    await Promise.all(
      mediaProperties.map(async p => {
        if (!values.metadata[p.name] || /^https?:\/\//.test(values.metadata[p.name])) {
          return Promise.resolve();
        }
        const { data, originalFile } = values.metadata[p.name];
        const blob = await fetch(data).then(r => r.blob());
        const file = new File([blob], originalFile.name, { type: blob.type });
        const fileID = uniqueID();

        metadataFiles[p.name] = fileID;

        entityAttachments.push({
          originalname: file.name,
          filename: file.name,
          type: 'attachment',
          mimetype: blob.type,
          fileLocalID: fileID,
        });

        files.push(file);

        return URL.revokeObjectURL(values.metadata[p.name]);
      })
    );
  }

  return { metadataFiles, entityAttachments, files };
};

function wrapEntityMetadata(entity) {
  if (!entity.metadata) {
    return { ...entity };
  }
  const newFileMetadataValues = (entity.attachments || [])
    .filter(attachment => attachment.fileLocalID)
    .reduce(
      (previousValue, attachment, index) => ({
        ...previousValue,
        [attachment.fileLocalID]: { value: '', attachment: index },
      }),
      {}
    );

  const metadata = Object.keys(entity.metadata).reduce((wrappedMo, key) => {
    const newFileMetadataValue = newFileMetadataValues[entity.metadata[key]];
    return {
      ...wrappedMo,
      [key]: Array.isArray(entity.metadata[key])
        ? entity.metadata[key].map(v => ({ value: v }))
        : [newFileMetadataValue || { value: entity.metadata[key] }],
    };
  }, {});
  // suggestedMetadata is always in metadata-object form.
  return { ...entity, metadata };
}

const prepareMetadataAndFiles = async (values, attachedFiles, template) => {
  const mediaProperties = template.properties.filter(p => p.type === 'image' || p.type === 'media');
  const { metadataFiles, entityAttachments, files } = await prepareFiles(mediaProperties, values);
  const fields = { ...values.metadata, ...metadataFiles };
  const entity = { ...values, metadata: fields, attachments: entityAttachments };
  const wrappedEntity = wrapEntityMetadata(entity);
  wrappedEntity.file = values.file ? values.file[0] : undefined;
  wrappedEntity.attachments = [];
  wrappedEntity.attachments.push(...files);
  wrappedEntity.attachments.push(...attachedFiles);
  return { ...wrappedEntity, template: template._id };
};

export { prepareMetadataAndFiles, wrapEntityMetadata };
