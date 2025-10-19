/* eslint-disable max-lines */
/* eslint-disable max-statements */
import { ClientSession, ObjectId } from 'mongodb';

import entities from 'api/entities';
import { applicationEventsBus } from 'api/core/libs/eventsbus';
import translations from 'api/i18n/translations';
import settings from 'api/settings/settings';
import dictionariesModel from 'api/thesauri/dictionariesModel';
import createError from 'api/utils/Error';
import { objectIndex } from 'shared/data_utils/objectIndex';
import { ensure } from 'shared/tsUtils';
import { LanguageISO6391, PropertySchema } from 'shared/types/commonTypes';
import { TemplateSchema } from 'shared/types/templateType';
import { tenants } from 'api/tenants';
import { DeleteTemplateUseCaseFactory } from 'api/core/infrastructure/factories/DeleteTemplateUseCaseFactory';
import { SetTemplateAsDefaultUseCaseFactory } from 'api/core/infrastructure/factories/SetTemplateAsDefaultUseCaseFactory';
import { MongoTemplateMapper } from 'api/core/infrastructure/mongodb/template/Mapper';
import { TemplateFacade } from 'api/core/infrastructure/facades/TemplateFacade';
import { TemplateDeletedEvent } from '../core/domain/template/events/TemplateDeletedEvent';
import model from './templatesModel';
import * as v2 from './v2_support';
import { TemplateValidationService } from './validation/TemplateValidationService';

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

const validationService = new TemplateValidationService();

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

  async removePropsWithNonexistentId(nonexistentId: string, session?: ClientSession) {
    const relatedTemplates = await model.get({ 'properties.content': nonexistentId }, undefined, {
      session,
    });
    const defaultLanguage = (await settings.getDefaultLanguage())?.key;
    if (!defaultLanguage) {
      throw Error('Missing default language.');
    }
    await Promise.all(
      relatedTemplates.map(async t =>
        this.save(
          {
            ...t,
            properties: (t.properties || []).filter(prop => prop.content !== nonexistentId),
          },
          defaultLanguage,
          false
        )
      )
    );
  },
  async validateTemplateDelete(templateToDelete: TemplateSchema, _id: string) {
    const countByTemplate = await this.countByTemplate(_id);
    await validationService.validateTemplateDelete(templateToDelete, countByTemplate);
  },

  async delete(template: Partial<TemplateSchema>) {
    const v2DeleteTemplateUseCase = tenants.current().featureFlags?.v2DeleteTemplateUseCase;
    if (v2DeleteTemplateUseCase) {
      const useCase = await DeleteTemplateUseCaseFactory.create();

      await useCase.execute({ templateId: template._id!.toString() });

      return template;
    }

    const _id = ensure<string>(template._id);
    const [templateToDelete] = await this.get({ _id });

    if (!templateToDelete) {
      return Promise.resolve();
    }

    await this.validateTemplateDelete(templateToDelete, _id);

    await v2.processNewRelationshipPropertiesOnDelete(template._id);

    await translations.deleteContext(_id);
    await this.removePropsWithNonexistentId(_id);
    await model.delete(_id);

    await applicationEventsBus.emit(new TemplateDeletedEvent({ templateId: _id }));

    return template;
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
