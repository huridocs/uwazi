export function wrapEntityMetadata(entity) {
  if (!entity.metadata) {
    return { ...entity };
  }
  const newUploads = (entity.attachments || [])
    .filter(attachment => attachment.fileLocalID)
    .reduce(
      (indices, attachment) => ({
        ...indices,
        [attachment.fileLocalID]: { value: '', attachment: entity.attachments.indexOf(attachment) },
      }),
      {}
    );

  const metadata = Object.keys(entity.metadata).reduce((wrappedMo, key) => {
    const imageIndex = newUploads[entity.metadata[key]];
    return {
      ...wrappedMo,
      [key]: Array.isArray(entity.metadata[key])
        ? entity.metadata[key].map(v => ({ value: v }))
        : [imageIndex || { value: entity.metadata[key] }],
    };
  }, {});
  // suggestedMetadata is always in metadata-object form.
  return { ...entity, metadata };
}
