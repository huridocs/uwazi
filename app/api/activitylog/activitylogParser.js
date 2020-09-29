import templates from 'api/templates';
import entities from 'api/entities';
import { buildActivityEntry } from 'api/activitylog/helpers';
import semanticSearchModel from 'api/semanticsearch/model';
import { allLanguages } from 'shared/languagesList';
import { methods } from './helpers';
import { typeParsers } from './migrationsParser';

const formatLanguage = langKey => {
  const lang = allLanguages.find(({ key }) => key === langKey);
  return lang ? `${lang.label} (${lang.key})` : langKey;
};

const formatDataLanguage = data => formatLanguage(data.key);

const translationsName = data => {
  const [context] = data.contexts;
  return data.contexts.length === 1
    ? `in ${context.label} (${context.id})`
    : 'in multiple contexts';
};

const nameFunc = data => `${data.label} (${data.key})`;

const migrationLog = log => {
  const data = JSON.parse(log.body);
  return typeParsers[data.type] ? typeParsers[data.type](data) : { beautified: false };
};

const templateName = data =>
  data.templateData ? `${data.templateData.name} (${data._id})` : data._id;

const loadTemplate = async data => {
  const templateData = await templates.getById(data.template || data._id);
  return { ...data, templateData };
};

const loadEntity = async data => {
  const _id = data.entityId || data._id;
  const sharedId = data.sharedId || data.entity;
  const query = { ...(_id && { _id }), ...(sharedId && { sharedId }) };
  const [entity] = await entities.get(query);
  return { ...data, entity, title: entity ? entity.title : undefined };
};

const extraTemplate = data =>
  `of type ${
    data.templateData
      ? data.templateData.name
      : `(${data.template ? data.template.toString() : 'unassigned'})`
  }`;

const extraAttachmentLanguage = data =>
  data.entity
    ? `of entity '${data.entity.title}' (${data.entity.sharedId}) ${formatLanguage(
        data.entity.language
      )} version`
    : null;

const searchName = data =>
  data.search ? `${data.search.searchTerm} (${data.searchId})` : data.searchId;

const loadSearch = async data => {
  const search = await semanticSearchModel.getById(data.searchId);
  return { ...data, search };
};

const entryValues = {
  'POST/api/entities/multipleupdate': { desc: 'Updated multiple entities' },
  'POST/api/entities/bulkdelete': { desc: 'Deleted multiple entities', method: methods.delete },
  'POST/api/attachments/upload': {
    desc: 'Uploaded attachment',
    method: methods.create,
    related: loadEntity,
    nameField: 'title',
  },
  'POST/api/settings': { desc: 'Updated settings' },
  'POST/api/relationships/bulk': { desc: 'Updated relationships' },
  'POST/api/upload': { desc: 'Uploaded document', method: methods.create },
  'POST/api/reupload': { desc: 'Re-uploaded document' },
  'POST/api/customisation/upload': { desc: 'Uploaded custom file', method: methods.create },
  'POST/api/import': { desc: 'Imported entities from file', method: methods.create },
  'POST/api/public': { desc: 'Created entity coming from a public form', method: methods.create },
  'POST/api/remotepublic': {
    desc: 'Submitted entity to a remote instance',
    method: methods.create,
  },
  'POST/api/references': { desc: 'Created relationship', method: methods.create, idField: '_id' },
  'POST/api/pages': {
    desc: 'Created page',
    method: methods.create,
    idField: 'sharedId',
    nameField: 'title',
  },
  'POST/api/templates': {
    desc: 'Created template',
    method: methods.create,
    idField: '_id',
    nameField: 'name',
  },
  'POST/api/thesauris': {
    desc: 'Created thesaurus',
    method: methods.create,
    idField: '_id',
    nameField: 'name',
  },
  'POST/api/relationtypes': {
    desc: 'Created relation type',
    method: methods.create,
    idField: '_id',
    nameField: 'name',
  },
  'POST/api/entities': {
    desc: 'Created entity / document',
    method: methods.create,
    idField: 'sharedId',
    nameField: 'title',
    related: loadTemplate,
    extra: extraTemplate,
  },
  'POST/api/documents': {
    desc: 'Created entity / document',
    method: methods.create,
    idField: 'sharedId',
    nameField: 'title',
    related: loadTemplate,
    extra: extraTemplate,
  },
  'DELETE/api/entities': {
    desc: 'Deleted entity / document',
    method: methods.delete,
    nameField: 'sharedId',
  },
  'DELETE/api/documents': {
    desc: 'Deleted entity / document',
    method: methods.delete,
    nameField: 'sharedId',
  },
  'POST/api/attachments/rename': {
    desc: 'Renamed attachment',
    idField: '_id',
    nameFunc: data => `${data.originalname} (${data._id})`,
    related: loadEntity,
    extra: extraAttachmentLanguage,
  },
  'DELETE/api/attachments/delete': {
    desc: 'Deleted attachment',
    method: methods.delete,
    nameField: 'attachmentId',
  },
  'POST/api/templates/setasdefault': {
    desc: 'Set default template',
    related: loadTemplate,
    nameFunc: templateName,
  },
  'DELETE/api/templates': { desc: 'Deleted template', method: methods.delete, nameField: '_id' },
  'DELETE/api/thesauris': { desc: 'Deleted thesaurus', method: methods.delete, nameField: '_id' },
  'DELETE/api/relationtypes': {
    desc: 'Deleted relation type',
    method: methods.delete,
    nameField: '_id',
  },
  'POST/api/translations': {
    desc: 'Updated translations',
    nameFunc: translationsName,
    extra: data => `in ${formatLanguage(data.locale)}`,
  },
  'POST/api/translations/languages': { desc: 'Added language', method: methods.create, nameFunc },
  'DELETE/api/translations/languages': {
    desc: 'Removed language',
    method: methods.delete,
    nameFunc: formatDataLanguage,
  },
  'POST/api/translations/setasdeafult': {
    desc: 'Set default language',
    nameFunc: formatDataLanguage,
  },
  'DELETE/api/pages': {
    desc: 'Deleted page',
    method: methods.delete,
    nameField: 'sharedId',
  },
  'DELETE/api/references': {
    desc: 'Deleted relationship',
    method: methods.delete,
    nameField: '_id',
  },
  'DELETE/api/customisation/upload': {
    desc: 'Deleted custom file',
    method: methods.delete,
    nameField: '_id',
  },
  'POST/api/users/new': {
    desc: 'Added new user',
    method: methods.create,
    nameField: 'username',
    extra: data => `with ${data.role} role`,
  },
  'POST/api/semantic-search': {
    desc: 'Started semantic search',
    method: methods.create,
    nameField: 'searchTerm',
  },
  'POST/api/semantic-search/stop': {
    desc: 'Stopped semantic search',
    nameFunc: searchName,
    related: loadSearch,
  },
  'POST/api/semantic-search/resume': {
    desc: 'Resumed semantic search',
    nameFunc: searchName,
    related: loadSearch,
  },
  'DELETE/api/semantic-search': {
    desc: 'Deleted semantic search',
    method: methods.delete,
    nameField: 'searchId',
  },
  'POST/api/files/upload/document': {
    desc: 'Uploaded file',
    method: methods.create,
    related: loadEntity,
    nameField: 'title',
  },
};

const getSemanticData = async data => {
  const action = `${data.method}${data.url}`;
  const entryValue = entryValues[action];
  if (entryValue) {
    const activityEntry = await buildActivityEntry(entryValue, data);
    return { ...activityEntry };
  }
  if (action === 'MIGRATE') {
    return migrationLog(data);
  }
  return { beautified: false };
};

export { getSemanticData };
