import Ajv from 'ajv';
import templatesModel from 'api/templates/templatesModel';
import { wrapValidator } from 'shared/tsUtils';
import { EntitySchema } from 'shared/types/entityType';
import { PropertySchema } from 'shared/types/commonTypes';
import { TemplateSchema } from 'shared/types/templateType';

import { validateMetadataField } from './validateMetadataField';
import { customErrorMessages, validators } from './metadataValidators';

const ajv = Ajv({ allErrors: true });

const validateField = (entity: EntitySchema) => async (
  err: Promise<Ajv.ErrorObject[]>,
  property: PropertySchema
) => {
  try {
    await validateMetadataField(property, entity);
    return err;
  } catch (e) {
    const currentErrors = await err;
    if (e instanceof Ajv.ValidationError) {
      return currentErrors.concat(e.errors);
    }
    throw e;
  }
};

const validateFields = async (template: TemplateSchema, entity: EntitySchema) => {
  const errors: Ajv.ErrorObject[] = await (template.properties || []).reduce<
    Promise<Ajv.ErrorObject[]>
  >(validateField(entity), Promise.resolve([]));
  return errors;
};

const validateAllowedProperties = async (template: TemplateSchema, entity: EntitySchema) => {
  const errors: Ajv.ErrorObject[] = [];
  const allowedProperties = (template.properties || []).map(p => p.name);
  Object.keys(entity.metadata || {}).forEach((propName: string) => {
    if (!allowedProperties.includes(propName)) {
      errors.push({
        keyword: 'metadataMatchesTemplateProperties',
        schemaPath: '',
        params: { keyword: 'metadataMatchesTemplateProperties', data: entity },
        message: customErrorMessages.property_not_allowed,
        dataPath: `.metadata['${propName}']`,
      });
    }
  });
  return errors;
};

ajv.addKeyword('metadataMatchesTemplateProperties', {
  async: true,
  errors: true,
  type: 'object',
  async validate(_fields: any, entity: EntitySchema) {
    if (!entity.template) {
      return true;
    }

    const [template = {} as TemplateSchema] = await templatesModel.get({ _id: entity.template });

    const errors: Ajv.ErrorObject[] = [
      ...(await validateFields(template, entity)),
      ...(await validateAllowedProperties(template, entity)),
    ];

    if (errors.length) {
      throw new Ajv.ValidationError(errors);
    }

    return true;
  },
});

ajv.addKeyword('validateTemplateExists', {
  async: true,
  errors: true,
  type: 'object',
  async validate(fields: any, entity: EntitySchema) {
    if (!entity.template) {
      return true;
    }
    const [template] = await templatesModel.get({ _id: entity.template });
    if (!template) {
      throw new Ajv.ValidationError([
        {
          keyword: 'metadataMatchesTemplateProperties',
          schemaPath: '',
          params: { keyword: 'metadataMatchesTemplateProperties', fields },
          message: 'template does not exist',
          dataPath: '.template',
        },
      ]);
    }
    return true;
  },
});

ajv.addKeyword('stringMeetsLuceneMaxLimit', {
  errors: false,
  type: 'string',
  validate(_schema: any, data: EntitySchema) {
    return validators.validateLuceneBytesLimit(data);
  },
});

const dataSchema = {
  $schema: 'http://json-schema.org/schema#',
  $async: true,
  type: 'object',
  metadataMatchesTemplateProperties: true,
  validateTemplateExists: true,
  properties: {
    title: { type: 'string', minLength: 1, stringMeetsLuceneMaxLimit: true },
  },
};

export const validateEntityData = async (entity: any) =>
  wrapValidator(ajv.compile(dataSchema))(entity);
