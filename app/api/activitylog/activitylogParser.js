import templates from 'api/templates';
import { allLanguages } from 'shared/languagesList';

const methods = {
  create: 'CREATE',
  update: 'UPDATE',
  delete: 'DELETE'
};

const generateCreateUpdateBeautifier = (resourceName, nameField, idField) => async (log) => {
  const data = JSON.parse(log.body);

  const semantic = {
    beautified: true,
    name: data[nameField]
  };

  if (data[idField]) {
    semantic.name = `${data[nameField]} (${data[idField]})`;
    semantic.action = methods.update;
    semantic.description = `Updated ${resourceName}`;
  } else {
    semantic.action = methods.create;
    semantic.description = `Created ${resourceName}`;
  }

  return semantic;
};


const generateDeleteBeautifier = (resourceName, idField) => async (log) => {
  const data = JSON.parse(log.query);

  return {
    beautified: true,
    action: methods.delete,
    description: `Deleted ${resourceName}`,
    name: data[idField]
  };
};

const entitiesPOST = async (log) => {
  const data = JSON.parse(log.body);
  const template = await templates.getById(data.template);

  const semantic = {
    beautified: true,
    name: data.title,
    extra: `of type ${template ? template.name : `(${data.template ? data.template.toString() : 'unassigned'})`}`
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

const entitiesDELETE = generateDeleteBeautifier('entity / document', 'sharedId');

const templatesAsDefaultPOST = async (log) => {
  const data = JSON.parse(log.body);
  const template = await templates.getById(data._id);

  return {
    beautified: true,
    action: methods.update,
    description: 'Set default template',
    name: template ? `${template.name} (${data._id})` : data._id,
  };
};

const translationsLanguagesPOST = async (log) => {
  const data = JSON.parse(log.body);

  return {
    beautified: true,
    action: methods.create,
    description: 'Added language',
    name: `${data.label} (${data.key})`
  };
};

const translationsLanguagesDELETE = async (log) => {
  const data = JSON.parse(log.query);
  const lang = allLanguages.find(({ key }) => key === data.key);

  return {
    beautified: true,
    action: methods.delete,
    description: 'Removed language',
    name: lang ? `${lang.label} (${lang.key})` : data.key
  };
};

const translationsAsDefaultPOST = async (log) => {
  const data = JSON.parse(log.body);
  const lang = allLanguages.find(({ key }) => key === data.key);

  return {
    beautified: true,
    action: methods.update,
    description: 'Set default language',
    name: lang ? `${lang.label} (${lang.key})` : data.key
  };
};

const actions = {
  'POST/api/entities': entitiesPOST,
  'POST/api/documents': entitiesPOST,
  'DELETE/api/entities': entitiesDELETE,
  'DELETE/api/documents': entitiesDELETE,
  'DELETE/api/attachments/delete': generateDeleteBeautifier('attachment', 'attachmentId'),
  'POST/api/templates': generateCreateUpdateBeautifier('template', 'name', '_id'),
  'POST/api/templates/setasdefault': templatesAsDefaultPOST,
  'DELETE/api/templates': generateDeleteBeautifier('template', '_id'),
  'POST/api/thesauris': generateCreateUpdateBeautifier('thesaurus', 'name', '_id'),
  'DELETE/api/thesauris': generateDeleteBeautifier('thesaurus', '_id'),
  'POST/api/relationtypes': generateCreateUpdateBeautifier('relation type', 'name', '_id'),
  'DELETE/api/relationtypes': generateDeleteBeautifier('relation type', '_id'),
  'POST/api/translations/languages': translationsLanguagesPOST,
  'DELETE/api/translations/languages': translationsLanguagesDELETE,
  'POST/api/translations/setasdeafult': translationsAsDefaultPOST,
  'POST/api/pages': generateCreateUpdateBeautifier('page', 'title', 'sharedId'),
  'DELETE/api/pages': generateDeleteBeautifier('page', 'sharedId')
};

const getSemanticData = async (data) => {
  if (actions[`${data.method}${data.url}`]) {
    return actions[`${data.method}${data.url}`](data);
  }

  return { beautified: false };
};

export {
  getSemanticData
};
