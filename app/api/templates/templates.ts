/* eslint-disable max-lines */
/* eslint-disable max-statements */
import { ClientSession, ObjectId } from 'mongodb';

import entities from 'api/entities';
import dictionariesModel from 'api/thesauri/dictionariesModel';
import createError from 'api/utils/Error';
import { objectIndex } from 'shared/data_utils/objectIndex';
import { LanguageISO6391, PropertySchema } from 'shared/types/commonTypes';
import { TemplateSchema } from 'shared/types/templateType';
import { tenants } from 'api/tenants';
import { SetTemplateAsDefaultUseCaseFactory } from 'api/core/infrastructure/factories/SetTemplateAsDefaultUseCaseFactory';
import { MongoTemplateMapper } from 'api/core/infrastructure/mongodb/template/Mapper';
import { TemplateFacade } from 'api/core/infrastructure/facades/TemplateFacade';
import model from './templatesModel';

const getRelatedThesauri = async (template: TemplateSchema, session?: ClientSession) => {
  const thesauriIds = (template.properties || []).map(p => p.content).filter(p => p);
  const thesauri = await dictionariesModel.get({ _id: { $in: thesauriIds } }, undefined, {
    session,
  });
  const thesauriByKey: Record<any, TemplateSchema> = {};
  thesauri.forEach(t => {
    thesauriByKey[t._id.toString()] = t;
  });
  return thesauriByKey;
};

export default {
  async save(
    template: TemplateSchema,
    language: string,
    _reindex = true,
    fullReindex = false,
    _onTemplateProcessed: (
      error?: Error,
      denormalizationExecuted?: boolean
    ) => Promise<void> = async () => {}
  ) {
    if (!template._id) {
      return TemplateFacade.create(template);
    }

    return TemplateFacade.update(
      { ...template, reindex: fullReindex } as any,
      language as LanguageISO6391
    );
  },

  async canDeleteProperty(
    template: ObjectId,
    property: ObjectId | string | undefined,
    session?: ClientSession
  ) {
    const tmps = await model.get({}, undefined, { session });
    return tmps.every(iteratedTemplate =>
      (iteratedTemplate.properties || []).every(
        iteratedProperty =>
          !iteratedProperty.content ||
          !iteratedProperty.inherit?.property ||
          !(
            iteratedProperty.content.toString() === template.toString() &&
            iteratedProperty.inherit.property.toString() === (property || '').toString()
          )
      )
    );
  },

  async get(query: any = {}) {
    return model.get(query);
  },

  async getPropertyByName(propertyName: string): Promise<PropertySchema> {
    const [property] = await this.getPropertiesByName([propertyName]);
    return property;
  },

  async getPropertiesByName(propertyNames: string[]): Promise<PropertySchema[]> {
    const nameSet = new Set(propertyNames);
    const templates = await this.get({
      $or: [
        { 'properties.name': { $in: propertyNames } },
        { 'commonProperties.name': { $in: propertyNames } },
      ],
    });
    const allProperties = templates
      .map(template => [template.properties || [], template.commonProperties || []])
      .flat()
      .flat()
      .filter(t => nameSet.has(t.name));
    const propertiesByName = objectIndex(
      allProperties,
      p => p.name,
      p => p
    );
    const missingProperties = propertyNames.filter(name => !propertiesByName[name]);
    if (missingProperties.length > 0) {
      throw createError(`Properties not found: ${missingProperties.join(', ')}`);
    }
    return Array.from(Object.values(propertiesByName));
  },

  async setAsDefault(_id: string) {
    const v2CreateTemplateUseCase = tenants.current().featureFlags?.v2SetTemplateAsDefaultUseCase;
    if (v2CreateTemplateUseCase) {
      const output = await SetTemplateAsDefaultUseCaseFactory.create().execute({
        templateId: _id.toString(),
      });

      return [
        MongoTemplateMapper.toSchema(output.current),
        output.previous && MongoTemplateMapper.toSchema(output.previous),
      ];
    }

    const [templateToBeDefault] = await this.get({ _id });
    const [currentDefault] = await this.get({ _id: { $nin: [_id] }, default: true });

    if (templateToBeDefault) {
      let saveCurrentDefault = Promise.resolve({});
      if (currentDefault) {
        saveCurrentDefault = model.save(
          {
            _id: currentDefault._id,
            default: false,
          },
          undefined
        );
      }
      return Promise.all([model.save({ _id, default: true }, undefined), saveCurrentDefault]);
    }

    throw createError('Invalid ID');
  },

  async getById(templateId: ObjectId | string) {
    return model.getById(templateId, undefined);
  },

  async delete(template: Partial<TemplateSchema>) {
    return TemplateFacade.delete({ _id: template._id!.toString() });
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
