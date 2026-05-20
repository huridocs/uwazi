const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

const getIconRecord = (entry: unknown) => {
  if (!isRecord(entry)) return null;
  const { icon } = entry;
  if (!isRecord(icon)) return null;
  return icon;
};

const relationshipEntryToDBO = (entry: unknown) => {
  if (!isRecord(entry)) return entry;
  const iconRecord = getIconRecord(entry);
  if (!iconRecord) return entry;

  const iconId = iconRecord.id;
  if (iconId === undefined) return entry;

  const { id, ...restIcon } = iconRecord;

  return {
    ...entry,
    icon: {
      _id: id,
      ...restIcon,
    },
  };
};

const relationshipEntryToDomain = (entry: unknown) => {
  if (!isRecord(entry)) return entry;
  const iconRecord = getIconRecord(entry);
  if (!iconRecord) return entry;

  const iconId = iconRecord._id ?? iconRecord.id;
  if (iconId === undefined) return entry;

  const { _id, id, ...restIcon } = iconRecord;

  return {
    ...entry,
    icon: {
      id: iconId,
      ...restIcon,
    },
  };
};

const MongoRelationshipMetadataMapper = {
  toDBO(value: unknown[]) {
    return value.map(entry => relationshipEntryToDBO(entry));
  },

  toDomain(value: unknown[]) {
    return value.map(entry => relationshipEntryToDomain(entry));
  },
};

export { MongoRelationshipMetadataMapper };
