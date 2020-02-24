import semanticSearchModel from 'api/semanticsearch/model';
import { allLanguages } from 'shared/languagesList';

export const methods = {
  create: 'CREATE',
  update: 'UPDATE',
  delete: 'DELETE',
};

export const formatLanguage = langKey => {
  const lang = allLanguages.find(({ key }) => key === langKey);
  return lang ? `${lang.label} (${lang.key})` : langKey;
};

export const generateCreateUpdateBeautifier = (resourceName, idField, nameField) => async log => {
  const data = JSON.parse(log.body);
  const name = data[nameField];

  const semantic = {
    beautified: true,
    name,
  };

  if (data[idField]) {
    semantic.name = name ? `${name} (${data[idField]})` : `${data[idField]}`;
    semantic.action = methods.update;
    semantic.description = `Updated ${resourceName}`;
  } else {
    semantic.action = methods.create;
    semantic.description = `Created ${resourceName}`;
  }

  return semantic;
};

export const generateDeleteBeautifier = (resourceName, idField) => async log => {
  const data = JSON.parse(log.query);

  return {
    beautified: true,
    action: methods.delete,
    description: `Deleted ${resourceName}`,
    name: data[idField],
  };
};

export const generatePlainDescriptionBeautifier = (
  description,
  action = methods.update
) => async () => ({
  beautified: true,
  action,
  description,
});

export const generateSemanticSearchUpdateBeautifier = description => async log => {
  const data = JSON.parse(log.body);
  const search = await semanticSearchModel.getById(data.searchId);

  const semantic = {
    beautified: true,
    action: methods.update,
    description,
    name: data.searchId,
  };

  if (search) {
    semantic.name = `${search.searchTerm} (${data.searchId})`;
  }

  return semantic;
};
