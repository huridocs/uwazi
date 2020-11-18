/** @format */

export function wrapEntityMetadata(entity) {
  if (!entity.metadata) {
    return { ...entity };
  }
  const metadata = Object.keys(entity.metadata).reduce(
    (wrappedMo, key) => ({
      ...wrappedMo,
      [key]: Array.isArray(entity.metadata[key])
        ? entity.metadata[key].map(v => ({ value: v }))
        : [{ value: entity.metadata[key] }],
    }),
    {}
  );
  // suggestedMetadata is always in metadata-object form.
  return { ...entity, metadata };
}
