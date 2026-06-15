import { ClientSession, ObjectId } from 'mongodb';

import entities from '#api/entities/index.js';
import createError from '#api/utils/Error.js';
import { LanguageISO6391, PropertySchema } from '#shared/types/commonTypes.js';
import { TemplateSchema } from '#shared/types/templateType.js';
import { TemplateFacade } from '#api/core/infrastructure/facades/TemplateFacade.js';
import model from './templatesModel.js';
import { ThesauriDAOFactory } from '#api/core/infrastructure/factories/ThesauriDAOFactory.js';
import { TemplatesDAOFactory } from '#api/core/infrastructure/factories/TemplatesDAOFactory.js';

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
    return dao.get(ids);
  },

  async getByNames(names: string[]) {
    const dao = TemplatesDAOFactory.default();
    return dao.getByNames(names);
  },

  async getByContent(contentId: string) {
    const dao = TemplatesDAOFactory.default();
    return dao.getByContent(contentId);
  },

  async getDefaultTemplate() {
    const dao = TemplatesDAOFactory.default();
    return dao.getDefaultTemplate();
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
    const result = await dao.get([templateId.toString()]);
    return result[0] || null;
  },

  async delete(template: Partial<TemplateSchema>) {
    return TemplateFacade.delete({ _id: template._id!.toString() });
  },

  async getByMongoQuery(query: any = {}, projection?: any) {
    return model.get(query, projection);
  },

  async countByTemplate(template: string, session?: ClientSession) {
    return entities.countByTemplate(template, session);
  },

  async countByThesauri(thesauriId: string) {
    return model.count({ 'properties.content': thesauriId });
  },

  async findUsingRelationTypeInProp(relationTypeId: string, session?: ClientSession) {
    return model.get({ 'properties.relationType': relationTypeId }, 'name', { session });
  },

  getRelatedThesauri,
};
