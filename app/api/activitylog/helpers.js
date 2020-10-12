import { allLanguages } from 'shared/languagesList';
import { typeParsers } from 'api/activitylog/migrationsParser';
import templates from 'api/templates/templates';
import entities from 'api/entities/entities';
import { files } from 'api/files';
import semanticSearchModel from 'api/semanticsearch/model';

export const formatLanguage = langKey => {
  const lang = allLanguages.find(({ key }) => key === langKey);
  return lang ? `${lang.label} (${lang.key})` : langKey;
};

export const formatDataLanguage = data => formatLanguage(data.key);

export const translationsName = data => {
  const [context] = data.contexts;
  return data.contexts.length === 1
    ? `in ${context.label} (${context.id})`
    : 'in multiple contexts';
};

export const nameFunc = data => `${data.label} (${data.key})`;

export const migrationLog = log => {
  const data = JSON.parse(log.body);
  return typeParsers[data.type] ? typeParsers[data.type](data) : { action: 'RAW' };
};

export const templateName = data =>
  data.templateData ? `${data.templateData.name} (${data._id})` : data._id;

export const loadTemplate = async data => {
  const templateData = await templates.getById(data.template || data._id);
  return { ...data, templateData };
};

export const loadEntity = async data => {
  const _id = data.entityId || data._id;
  const sharedId = data.sharedId || data.entity;
  const query = { ...(_id && { _id }), ...(sharedId && { sharedId }) };
  const [entity] = await entities.get(query);
  return { ...data, entity, title: entity ? entity.title : undefined };
};

export const loadFile = async data => {
  const [file] = await files.get({ _id: data._id });
  return { ...data, file, title: file.originalname ? file.originalname : undefined };
};

export const extraTemplate = data =>
  `of type ${
    data.templateData
      ? data.templateData.name
      : `(${data.template ? data.template.toString() : 'unassigned'})`
  }`;

export const extraAttachmentLanguage = data =>
  data.entity
    ? `of entity '${data.entity.title}' (${data.entity.sharedId}) ${formatLanguage(
        data.entity.language
      )} version`
    : null;

export const searchName = data =>
  data.search ? `${data.search.searchTerm} (${data.searchId})` : data.searchId;

export const loadSearch = async data => {
  const search = await semanticSearchModel.getById(data.searchId);
  return { ...data, search };
};

export const updatedFile = data => {
  let name;
  if (data.toc) {
    name = 'ToC, ';
  } else {
    name = data.pdfinfo ? 'Pdf info, ' : '';
  }
  return `${name}${data.title}`;
};
