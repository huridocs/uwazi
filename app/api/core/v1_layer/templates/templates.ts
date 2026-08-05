import { ClientSession, ObjectId } from 'mongodb';

import entities from '#api/entities/index.js';
import createError from '#api/utils/Error.js';
import { LanguageISO6391, PropertySchema } from '#shared/types/commonTypes.js';
import { TemplateSchema } from '#shared/types/templateType.js';
import { TemplateFacade } from '#api/core/infrastructure/facades/TemplateFacade.js';
import { ThesauriDAOFactory } from '#api/core/infrastructure/factories/ThesauriDAOFactory.js';
import { TemplatesDAOFactory } from '#api/core/infrastructure/factories/TemplatesDAOFactory.js';
import { PostgresTemplateMapper } from '#api/core/infrastructure/postgresql/template/PostgresTemplateMapper.js';
import { MongoTemplateMapper } from '#api/core/infrastructure/mongodb/template/MongoTemplateMapper.js';
import { TemplateDBO } from '#api/core/infrastructure/mongodb/template/DBOs/TemplateDBO.js';
import { TemplateRow } from '#api/core/infrastructure/postgresql/template/PostgresTemplateMapper.js';

type TemplateDaoShape = (TemplateRow | TemplateDBO) & { name?: string };

const isTemplateRow = (template: TemplateDaoShape): template is TemplateRow =>
  typeof template._id === 'string';

const toMongoSchema = (template: TemplateDaoShape): TemplateDBO => {
  if (isTemplateRow(template)) {
    return MongoTemplateMapper.toSchema(PostgresTemplateMapper.toDomain(template as TemplateRow));
  }
  return template as TemplateDBO;
};

const getRelatedThesauri = async (template: TemplateSchema) => {
  const thesauriIds = (template.properties || [])
    .map(p => p.content)
    .filter((p): p is string => !!p);
  const thesauri = await ThesauriDAOFactory.default().get(thesauriIds);

  const thesauriByKey: Record<any, TemplateSchema> = {};
  thesauri.forEach(t => {
    thesauriByKey[t._id.toString()] = t as TemplateSchema;
  });
  return thesauriByKey;
};

export default {
  async save(template: TemplateSchema, language: string, _reindex = true, fullReindex = false) {
    if (!template._id) {
      return TemplateFacade.create(template);
    }

    return TemplateFacade.update(
      { ...template, reindex: fullReindex } as any,
      language as LanguageISO6391
    );
  },

  async get(ids?: string[]) {
    const dao = TemplatesDAOFactory.default();
    const rows = await dao.get(ids);
    return rows.map(toMongoSchema);
  },

  async getByNames(names: string[]) {
    const dao = TemplatesDAOFactory.default();
    const rows = await dao.getByNames(names);
    return rows.map(toMongoSchema);
  },

  async getByContent(contentId: string) {
    const dao = TemplatesDAOFactory.default();
    const rows = await dao.getByContent(contentId);
    return rows.map(toMongoSchema);
  },

  async getByContents(contentIds: string[]) {
    const dao = TemplatesDAOFactory.default();
    const rows = await dao.getByContents(contentIds);
    return rows.map(toMongoSchema);
  },

  async getByInheritedProperties(propertyIds: string[]) {
    const dao = TemplatesDAOFactory.default();
    const rows = await dao.getByInheritedProperties(propertyIds);
    return rows.map(toMongoSchema);
  },

  async getByEntityViewPage(pageId: string) {
    const dao = TemplatesDAOFactory.default();
    const rows = await dao.getByEntityViewPage(pageId);
    return rows.map(toMongoSchema);
  },

  async getByContentsOrUnrestrictedRelationship(contentIds: string[]) {
    const dao = TemplatesDAOFactory.default();
    const rows = await dao.getByContentsOrUnrestrictedRelationship(contentIds);
    return rows.map(toMongoSchema);
  },

  async getDefaultTemplate() {
    const dao = TemplatesDAOFactory.default();
    const row = await dao.getDefaultTemplate();
    return row ? toMongoSchema(row) : null;
  },

  async getAllIds() {
    const dao = TemplatesDAOFactory.default();
    return dao.getAllIds();
  },

  async getPropertyByName(propertyName: string): Promise<PropertySchema> {
    const property = await TemplatesDAOFactory.default().getPropertyByName(propertyName);
    if (!property) {
      throw createError(`Properties not found: ${propertyName}`);
    }
    return property;
  },

  async getById(templateId: ObjectId | string) {
    const dao = TemplatesDAOFactory.default();
    const rows = await dao.get([templateId.toString()]);
    const row = rows[0];
    return row ? toMongoSchema(row) : null;
  },

  async delete(template: Partial<TemplateSchema>) {
    return TemplateFacade.delete({ _id: template._id!.toString() });
  },

  async countByTemplate(template: string, session?: ClientSession) {
    return entities.countByTemplate(template, session);
  },

  async countByThesauri(thesauriId: string) {
    const dao = TemplatesDAOFactory.default();
    return dao.countByThesauri(thesauriId);
  },

  async findUsingRelationTypeInProp(relationTypeId: string) {
    const dao = TemplatesDAOFactory.default();
    const rows = await dao.findUsingRelationTypeInProp(relationTypeId);
    return rows.map(row => ({
      _id: typeof row._id === 'string' ? new ObjectId(row._id) : row._id,
      name: row.name,
    }));
  },

  getRelatedThesauri,
};
