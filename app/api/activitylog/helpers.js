import { allLanguages } from 'shared/languagesList';
import { typeParsers } from 'api/activitylog/migrationsParser';
import templates from 'api/templates/templates';
import entities from 'api/entities/entities';
import { files } from 'api/files';
import semanticSearchModel from 'api/semanticsearch/model';

export const methods = {
  create: 'CREATE',
  update: 'UPDATE',
  delete: 'DELETE',
  migrate: 'MIGRATE',
};

const buildActivityLogEntry = builder => ({
  description: builder.description,
  action: builder.action || methods.update,
  beautified: builder.beautified,
  ...(builder.name && { name: builder.name }),
  ...(builder.extra && { extra: builder.extra }),
});

export class ActivityLogBuilder {
  constructor(data, entryValue) {
    this.description = entryValue.desc;
    this.data = data;
    this.action = entryValue.method ? entryValue.method : methods.update;
    this.beautified = true;
    this.entryValue = entryValue;
  }

  async loadRelated() {
    if (this.entryValue.related) {
      this.data = await this.entryValue.related(this.data);
    }
  }

  makeExtra() {
    if (this.entryValue.extra) {
      this.extra = this.entryValue.extra(this.data);
    }
  }

  makeName() {
    if (this.entryValue.nameFunc) {
      this.name = this.entryValue.nameFunc(this.data);
    } else if (this.entryValue.id) {
      this.name = this.getNameWithId();
    } else if (this.entryValue.nameField) {
      this.name = this.data[this.entryValue.nameField] || this.data.name;
    }
  }

  getNameWithId() {
    const nameField = this.entryValue.nameField || 'name';
    const name = this.data[nameField];
    return name ? `${name} (${this.entryValue.id})` : `${this.entryValue.id}`;
  }

  build() {
    return buildActivityLogEntry(this);
  }
}

const changeToUpdate = entryValue => {
  const updatedEntry = { ...entryValue, method: methods.update };
  updatedEntry.desc = updatedEntry.desc.replace('Created', 'Updated');
  return updatedEntry;
};

function checkForUpdate(body, entryValue) {
  const content = JSON.parse(body);
  const id = entryValue.idField ? content[entryValue.idField] : null;
  let activityInput = { ...entryValue };
  if (id && entryValue.method !== methods.delete) {
    activityInput = changeToUpdate(entryValue);
    activityInput.id = id;
  }
  return activityInput;
}

const getActivityInput = (entryValue, body) => {
  const idPost = entryValue.idField && body;
  return idPost ? checkForUpdate(body, entryValue) : entryValue;
};

export const buildActivityEntry = async (entryValue, data) => {
  const body = data.body || data.query;
  const activityInput = getActivityInput(entryValue, body);
  const activityEntryBuilder = new ActivityLogBuilder(JSON.parse(body), activityInput);
  await activityEntryBuilder.loadRelated();
  activityEntryBuilder.makeName();
  activityEntryBuilder.makeExtra();
  return activityEntryBuilder.build();
};

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
  return typeParsers[data.type] ? typeParsers[data.type](data) : { beautified: false };
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
