import templates from 'api/templates';

const methods = {
  create: 'CREATE',
  update: 'UPDATE',
  delete: 'DELETE'
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

const entitiesDELETE = async (log) => {
  const data = JSON.parse(log.query);

  const semantic = {
    beautified: true,
    action: methods.delete,
    description: 'Deleted entity / document',
    name: data.sharedId,
  };

  return semantic;
};

const attachmentsDELETE = async (log) => {
  const data = JSON.parse(log.query);

  const semantic = {
    beautified: true,
    action: methods.delete,
    description: 'Deleted attachment',
    name: data.attachmentId
  };

  return semantic;
};

const templatesPOST = async (log) => {
  const data = JSON.parse(log.body);

  const semantic = {
    beautified: true,
    name: data.name,
  };

  if (data._id) {
    semantic.name = `${data.name} (${data._id})`;
    semantic.action = methods.update;
    semantic.description = 'Updated template';
  } else {
    semantic.action = methods.create;
    semantic.description = 'Created template';
  }

  return semantic;
};

const templatesDELETE = async (log) => {
  const data = JSON.parse(log.query);

  const semantic = {
    beautified: true,
    action: methods.delete,
    description: 'Deleted template',
    name: data._id
  };

  return semantic;
};

const createCreateUpdateBeautifier = (resourceName, nameField, idField) => async (log) => {
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


const createDeleteBeautifier = (resourceName, idField) => async (log) => {
  const data = JSON.parse(log.query);

  return {
    beautified: true,
    action: methods.delete,
    description: `Deleted ${resourceName}`,
    name: data[idField]
  };
};

const actions = {
  'POST/api/entities': entitiesPOST,
  'POST/api/documents': entitiesPOST,
  'DELETE/api/entities': entitiesDELETE,
  'DELETE/api/documents': entitiesDELETE,
  'DELETE/api/attachments/delete': attachmentsDELETE,
  'POST/api/templates': templatesPOST,
  'DELETE/api/templates': templatesDELETE,
  'POST/api/thesauris': createCreateUpdateBeautifier('thesaurus', 'name', '_id'),
  'DELETE/api/thesauris': createDeleteBeautifier('thesaurus', '_id')
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
