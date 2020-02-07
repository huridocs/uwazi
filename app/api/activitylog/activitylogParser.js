import templates from 'api/templates';
import entities from 'api/entities';

import {
  methods,
  generateCreateUpdateBeautifier,
  generateDeleteBeautifier,
  generatePlainDescriptionBeautifier,
  generateSemanticSearchUpdateBeautifier,
  formatLanguage,
} from './helpers';

const entitiesPOST = async log => {
  const data = JSON.parse(log.body);
  const template = await templates.getById(data.template);

  const semantic = {
    beautified: true,
    name: data.title,
    extra: `of type ${
      template ? template.name : `(${data.template ? data.template.toString() : 'unassigned'})`
    }`,
  };

  if (data.sharedId) {
    semantic.name = `${data.title} (${data.sharedId})`;
    semantic.action = methods.update;
    semantic.description = 'Updated entity / document';
  } else {
    semantic.action = methods.create;
    semantic.description = 'Created entity / document';
  }

  return semantic;
};

const documentsPdfInfoPOST = async log => {
  const data = JSON.parse(log.body);
  const [entity] = await entities.get({ _id: data._id, sharedId: data.sharedId });

  const semantic = {
    beautified: true,
    action: methods.update,
    description: 'Processed document pdf',
  };

  if (entity) {
    semantic.name = `${entity.title} (${entity.sharedId})`;
    semantic.extra = `${formatLanguage(entity.language)} version`;
  } else {
    semantic.name = data.sharedId;
  }

  return semantic;
};

const entitiesDELETE = generateDeleteBeautifier('entity / document', 'sharedId');

const attachmentsRenamePOST = async log => {
  const data = JSON.parse(log.body);
  const [entity] = await entities.get({ _id: data.entityId });

  const semantic = {
    beautified: true,
    action: methods.update,
    description: 'Renamed attachment',
    name: `${data.originalname} (${data._id})`,
  };

  if (entity) {
    semantic.extra = `of entity '${entity.title}' (${entity.sharedId}) ${formatLanguage(
      entity.language
    )} version`;
  }
  return semantic;
};

const templatesAsDefaultPOST = async log => {
  const data = JSON.parse(log.body);
  const template = await templates.getById(data._id);

  return {
    beautified: true,
    action: methods.update,
    description: 'Set default template',
    name: template ? `${template.name} (${data._id})` : data._id,
  };
};

const translationsPOST = async log => {
  const data = JSON.parse(log.body);
  const [context] = data.contexts;
  let name = 'in multiple contexts';
  if (data.contexts.length === 1) {
    name = `in ${context.label} (${context.id})`;
  }

  return {
    beautified: true,
    action: methods.update,
    description: 'Updated translations',
    name,
    extra: `in ${formatLanguage(data.locale)}`,
  };
};

const translationsLanguagesPOST = async log => {
  const data = JSON.parse(log.body);

  return {
    beautified: true,
    action: methods.create,
    description: 'Added language',
    name: `${data.label} (${data.key})`,
  };
};

const translationsLanguagesDELETE = async log => {
  const data = JSON.parse(log.query);

  return {
    beautified: true,
    action: methods.delete,
    description: 'Removed language',
    name: formatLanguage(data.key),
  };
};

const translationsAsDefaultPOST = async log => {
  const data = JSON.parse(log.body);

  return {
    beautified: true,
    action: methods.update,
    description: 'Set default language',
    name: formatLanguage(data.key),
  };
};

const usersNewPOST = async log => {
  const data = JSON.parse(log.body);

  return {
    beautified: true,
    action: methods.create,
    description: 'Added new user',
    name: data.username,
    extra: `with ${data.role} role`,
  };
};

const semanticSearchPOST = async log => {
  const data = JSON.parse(log.body);

  return {
    beautified: true,
    action: methods.create,
    description: 'Started semantic search',
    name: data.searchTerm,
  };
};

const actions = {
  'POST/api/entities': entitiesPOST,
  'POST/api/documents': entitiesPOST,
  'POST/api/documents/pdfInfo': documentsPdfInfoPOST,
  'DELETE/api/entities': entitiesDELETE,
  'POST/api/entities/multipleupdate': generatePlainDescriptionBeautifier(
    'Updated multiple entities'
  ),
  'POST/api/entities/bulkdelete': generatePlainDescriptionBeautifier(
    'Deleted multiple entities',
    methods.delete
  ),
  'DELETE/api/documents': entitiesDELETE,
  'POST/api/attachments/upload': generatePlainDescriptionBeautifier(
    'Uploaded attachment',
    methods.create
  ),
  'POST/api/attachments/rename': attachmentsRenamePOST,
  'DELETE/api/attachments/delete': generateDeleteBeautifier('attachment', 'attachmentId'),
  'POST/api/templates': generateCreateUpdateBeautifier('template', '_id', 'name'),
  'POST/api/templates/setasdefault': templatesAsDefaultPOST,
  'DELETE/api/templates': generateDeleteBeautifier('template', '_id'),
  'POST/api/thesauris': generateCreateUpdateBeautifier('thesaurus', '_id', 'name'),
  'DELETE/api/thesauris': generateDeleteBeautifier('thesaurus', '_id'),
  'POST/api/relationtypes': generateCreateUpdateBeautifier('relation type', '_id', 'name'),
  'DELETE/api/relationtypes': generateDeleteBeautifier('relation type', '_id'),
  'POST/api/translations': translationsPOST,
  'POST/api/translations/languages': translationsLanguagesPOST,
  'DELETE/api/translations/languages': translationsLanguagesDELETE,
  'POST/api/translations/setasdeafult': translationsAsDefaultPOST,
  'POST/api/pages': generateCreateUpdateBeautifier('page', 'sharedId', 'title'),
  'DELETE/api/pages': generateDeleteBeautifier('page', 'sharedId'),
  'POST/api/settings': generatePlainDescriptionBeautifier('Updated settings'),
  'POST/api/relationships/bulk': generatePlainDescriptionBeautifier('Updated relationships'),
  'POST/api/references': generateCreateUpdateBeautifier('relationship', '_id'),
  'DELETE/api/references': generateDeleteBeautifier('relationship', '_id'),
  'POST/api/upload': generatePlainDescriptionBeautifier('Uploaded document', methods.create),
  'POST/api/reupload': generatePlainDescriptionBeautifier('Re-uploaded document', methods.update),
  'POST/api/customisation/upload': generatePlainDescriptionBeautifier(
    'Uploaded custom file',
    methods.create
  ),
  'DELETE/api/customisation/upload': generateDeleteBeautifier('custom file', '_id'),
  'POST/api/import': generatePlainDescriptionBeautifier(
    'Imported entities from file',
    methods.create
  ),
  'POST/api/public': generatePlainDescriptionBeautifier(
    'Created entity coming from a public form',
    methods.create
  ),
  'POST/api/remotepublic': generatePlainDescriptionBeautifier(
    'Submitted entity to a remote instance',
    methods.create
  ),
  'POST/api/users/new': usersNewPOST,
  'POST/api/semantic-search': semanticSearchPOST,
  'DELETE/api/semantic-search': generateDeleteBeautifier('semantic search', 'searchId'),
  'POST/api/semantic-search/stop': generateSemanticSearchUpdateBeautifier(
    'Stopped semantic search'
  ),
  'POST/api/semantic-search/resume': generateSemanticSearchUpdateBeautifier(
    'Resumed semantic search'
  ),
};

const getSemanticData = async data => {
  if (actions[`${data.method}${data.url}`]) {
    return actions[`${data.method}${data.url}`](data);
  }

  return { beautified: false };
};

export { getSemanticData };
