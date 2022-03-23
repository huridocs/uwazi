export function wrapEntityMetadata(entity) {
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
