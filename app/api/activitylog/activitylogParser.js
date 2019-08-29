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
    extra: `of type ${template ? template.name : `(${data.template.toString()})`}`
  };

  if (!data.sharedId) {
    semantic.action = methods.create;
    semantic.description = 'Created entity / document';
  }

  if (data.sharedId) {
    semantic.action = methods.update;
    semantic.description = 'Updated entity / document';
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

const actions = {
  'POST/api/entities': entitiesPOST,
  'POST/api/documents': entitiesPOST,
  'DELETE/api/entities': entitiesDELETE,
  'DELETE/api/documents': entitiesDELETE,
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
