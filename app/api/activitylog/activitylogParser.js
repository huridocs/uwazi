import * as helpers from 'api/activitylog/helpers';
import { methods, nameFunc } from 'api/activitylog/helpers';

const entryValues = {
  'POST/api/entities/multipleupdate': { desc: 'Updated multiple entities' },
  'POST/api/entities/bulkdelete': { desc: 'Deleted multiple entities', method: methods.delete },
  'POST/api/attachments/upload': {
    desc: 'Uploaded attachment',
    method: methods.create,
    related: helpers.loadEntity,
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
    related: helpers.loadTemplate,
    extra: helpers.extraTemplate,
  },
  'POST/api/documents': {
    desc: 'Created entity / document',
    method: methods.create,
    idField: 'sharedId',
    nameField: 'title',
    related: helpers.loadTemplate,
    extra: helpers.extraTemplate,
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
    related: helpers.loadEntity,
    extra: helpers.extraAttachmentLanguage,
  },
  'DELETE/api/attachments/delete': {
    desc: 'Deleted attachment',
    method: methods.delete,
    nameField: 'attachmentId',
  },
  'POST/api/templates/setasdefault': {
    desc: 'Set default template',
    related: helpers.loadTemplate,
    nameFunc: helpers.templateName,
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
    nameFunc: helpers.translationsName,
    extra: data => `in ${helpers.formatLanguage(data.locale)}`,
  },
  'POST/api/translations/languages': { desc: 'Added language', method: methods.create, nameFunc },
  'DELETE/api/translations/languages': {
    desc: 'Removed language',
    method: methods.delete,
    nameFunc: helpers.formatDataLanguage,
  },
  'POST/api/translations/setasdeafult': {
    desc: 'Set default language',
    nameFunc: helpers.formatDataLanguage,
  },
  'DELETE/api/pages': { desc: 'Deleted page', method: methods.delete, nameField: 'sharedId' },
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
    nameFunc: helpers.searchName,
    related: helpers.loadSearch,
  },
  'POST/api/semantic-search/resume': {
    desc: 'Resumed semantic search',
    nameFunc: helpers.searchName,
    related: helpers.loadSearch,
  },
  'DELETE/api/semantic-search': {
    desc: 'Deleted semantic search',
    method: methods.delete,
    nameField: 'searchId',
  },
  'POST/api/files/upload/document': {
    desc: 'Uploaded file',
    method: methods.create,
    related: helpers.loadEntity,
    nameField: 'title',
  },
  'DELETE/api/files': { desc: 'Delete file', method: methods.delete, nameField: '_id' },
  'POST/api/files': {
    desc: 'Updated file',
    related: helpers.loadFile,
    nameFunc: helpers.updatedFile,
  },
  'DELETE/api/users': { desc: 'Delete user', method: methods.delete, nameField: '_id' },
};

const getSemanticData = async data => {
  const action = `${data.method}${data.url}`;
  const entryValue = entryValues[action];
  if (entryValue) {
    const activityEntry = await helpers.buildActivityEntry(entryValue, data);
    return { ...activityEntry };
  }
  if (action === 'MIGRATE') {
    return helpers.migrationLog(data);
  }
  return { beautified: false };
};

export { getSemanticData };
