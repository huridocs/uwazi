import { propertyTypes } from '#shared/propertyTypes.js';

const asStringId = value => {
  if (value === null || value === undefined) {
    return value;
  }
  return typeof value === 'string' ? value : value.toString();
};

const normalizeIcon = icon => {
  if (!icon) {
    return icon;
  }
  return {
    ...icon,
    _id: icon._id === null ? null : asStringId(icon._id),
  };
};

const normalizeDocuments = (documents = []) =>
  documents
    .filter(document => document?.originalname)
    .map(document => ({
      ...document,
      _id: asStringId(document._id),
    }))
    .filter(document => document._id);

const normalizeAttachments = (attachments = []) =>
  attachments
    .filter(attachment => attachment?.originalname)
    .map(attachment => ({
      ...attachment,
      _id: attachment._id ? asStringId(attachment._id) : undefined,
    }));

const normalizeLegacyEntityForFacade = entity => ({
  ...entity,
  _id: asStringId(entity._id),
  user: asStringId(entity.user),
  template: asStringId(entity.template),
  icon: normalizeIcon(entity.icon),
  documents: normalizeDocuments(entity.documents),
  attachments: normalizeAttachments(entity.attachments),
});

const uniqueMetadataObject = (elem, pos, arr) =>
  elem.value && arr.findIndex(entry => entry.value === elem.value) === pos;

const hasEmptySelectValue = values => !values || !values[0] || !values[0].value;

const removeMetadataProperty = (metadata, propertyName) => {
  const { [propertyName]: _omitted, ...rest } = metadata;
  return rest;
};

const withValue = (metadata, name, value) => ({ ...metadata, [name]: value });

const numericMetadataSanitizer = ({ name, values, metadata }) => {
  if (typeof values?.[0]?.value !== 'string') {
    return metadata;
  }
  if (values[0].value === '') {
    return removeMetadataProperty(metadata, name);
  }
  return withValue(metadata, name, [{ value: parseFloat(values[0].value) }]);
};

const metadataSanitizersByType = {
  [propertyTypes.multiselect]: ({ name, values, metadata }) =>
    withValue(metadata, name, values.filter(uniqueMetadataObject)),
  [propertyTypes.relationship]: ({ name, values, metadata }) =>
    withValue(metadata, name, values.filter(uniqueMetadataObject)),
  [propertyTypes.date]: ({ name, values, metadata }) =>
    withValue(
      metadata,
      name,
      values.filter(value => value.value)
    ),
  [propertyTypes.multidate]: ({ name, values, metadata }) =>
    withValue(
      metadata,
      name,
      values.filter(value => value.value)
    ),
  [propertyTypes.daterange]: ({ name, values, metadata }) =>
    withValue(
      metadata,
      name,
      values.filter(value => value.value.from || value.value.to)
    ),
  [propertyTypes.multidaterange]: ({ name, values, metadata }) =>
    withValue(
      metadata,
      name,
      values.filter(value => value.value.from || value.value.to)
    ),
  [propertyTypes.select]: ({ name, values, metadata }) =>
    hasEmptySelectValue(values) ? withValue(metadata, name, []) : metadata,
  [propertyTypes.numeric]: numericMetadataSanitizer,
};

const sanitizePropertyValue = ({ type, name, values, metadata }) => {
  const sanitizeByType = metadataSanitizersByType[type];
  return sanitizeByType ? sanitizeByType({ name, values, metadata }) : metadata;
};

const sanitizeForTemplate = (doc, template) => {
  if (!doc.metadata || !template) {
    return doc;
  }

  const metadata = template.properties.reduce((sanitizedMetadata, property) => {
    const { type, name } = property;
    const values = sanitizedMetadata[name];

    if (!values) {
      return { ...sanitizedMetadata, [name]: [] };
    }

    return sanitizePropertyValue({ type, name, values, metadata: sanitizedMetadata });
  }, doc.metadata);

  return { ...doc, metadata };
};

export {
  asStringId,
  normalizeAttachments,
  normalizeDocuments,
  normalizeIcon,
  normalizeLegacyEntityForFacade,
  sanitizeForTemplate,
};
