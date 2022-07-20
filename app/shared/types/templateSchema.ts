import Ajv, { ErrorObject } from 'ajv';
import { ObjectId } from 'mongodb';

import model from 'api/templates/templatesModel';
import templates from 'api/templates';
import pages from 'api/pages';
import { thesauri } from 'api/thesauri/thesauri';

import { ensure, wrapValidator } from 'shared/tsUtils';
import { objectIdSchema, propertySchema } from 'shared/types/commonSchemas';
import { getCompatibleTypes } from 'shared/propertyTypes';

import { TemplateSchema } from './templateType';
import { PropertySchema } from './commonTypes';

export const emitSchemaTypes = true;

const ajv = new Ajv({ allErrors: true });
ajv.addVocabulary(['tsType']);

ajv.addKeyword({
  keyword: 'uniqueName',
  async: true,
  errors: false,
  type: 'object',
  async validate(schema: any, data: TemplateSchema) {
    if (!schema) {
      return true;
    }
    const regex = new RegExp(`^${data.name}$`, 'i');
    const [similarTemplate] = await model.get({ _id: { $ne: data._id }, name: regex });
    if (similarTemplate) {
      return false;
    }
    return true;
  },
});

ajv.addKeyword({
  keyword: 'requireTitleProperty',
  errors: false,
  type: 'array',
  validate(_schema: any, properties: PropertySchema[]) {
    return properties.some(prop => prop.name === 'title');
  },
});

ajv.addKeyword({
  keyword: 'uniquePropertyFields',
  errors: false,
  type: 'object',
  validate(fields: (keyof PropertySchema)[], data: TemplateSchema) {
    const uniqueValues: { [k: string]: Set<string> } = fields.reduce(
      (memo, field) => ({ ...memo, [field]: new Set() }),
      {}
    );

    const allProperties = (data.properties || []).concat(data.commonProperties || []);

    const errors: ErrorObject[] = [];
    allProperties.forEach(property => {
      fields.forEach(field => {
        const value = property[field] && (property[field]?.toString() || '').toLowerCase().trim();
        if (value && uniqueValues[field].has(value)) {
          errors.push({
            keyword: 'uniquePropertyFields',
            schemaPath: '',
            params: { keyword: 'uniquePropertyFields', fields },
            message: `duplicated property value { ${field}: "${value}" }`,
            instancePath: `.properties.${field}`,
          });
        }
        uniqueValues[field].add(value || '');
      });
    });

    if (errors.length) {
      throw new Ajv.ValidationError(errors);
    }

    return true;
  },
});

ajv.addKeyword({
  keyword: 'requireOrInvalidContentForSelectFields',
  async: true,
  errors: false,
  type: 'object',
  async validate(schema: any, data: PropertySchema) {
    if (!schema) {
      return true;
    }
    if (['multiselect', 'select'].includes(data.type)) {
      if (!data.content || !data.content.length) {
        return false;
      }

      const found = await thesauri.getById(data.content);
      return !!found;
    }

    return true;
  },
});

ajv.addKeyword({
  keyword: 'requireRelationTypeForRelationship',
  errors: false,
  type: 'object',
  validate(schema: any, data: PropertySchema) {
    if (!schema) {
      return true;
    }
    if (data.type === 'relationship') {
      return !!(data.relationType && data.relationType.length);
    }
    return true;
  },
});

ajv.addKeyword({
  keyword: 'cantDeleteInheritedProperties',
  async: true,
  errors: true,
  type: 'object',
  async validate(_schema: any, template: TemplateSchema) {
    const [currentTemplate] = await model.get({ _id: template._id });
    if (!currentTemplate) {
      return true;
    }

    const toRemoveProperties = (currentTemplate.properties || []).filter(
      prop =>
        !(template.properties || []).find(
          p => p._id && p._id.toString() === (prop._id || '').toString()
        )
    );

    const errors: ErrorObject[] = [];
    await Promise.all(
      toRemoveProperties.map(async property => {
        const canDelete = await templates.canDeleteProperty(
          ensure<ObjectId>(template._id),
          property._id
        );

        if (!canDelete) {
          errors.push({
            keyword: 'noDeleteInheritedProperty',
            schemaPath: '',
            params: { keyword: 'noDeleteInheritedProperty' },
            message: "Can't delete properties being inherited",
            instancePath: `.properties.${property.name}`,
          });
        }
      })
    );

    if (errors.length) {
      throw new Ajv.ValidationError(errors);
    }

    return true;
  },
});

async function getPropertiesWithSameNameAndDifferentKind(template: TemplateSchema) {
  const condition = ensure<PropertySchema[]>(template.properties).map(property => ({
    $and: [
      {
        name: property.name,
        $or: [
          { content: { $ne: property.content } },
          { type: { $ne: property.type } },
          { relationtype: { $ne: property.relationType } },
          { 'inherit.type': { $ne: property.inherit?.type } },
        ],
      },
    ],
  }));
  const query = {
    $and: [{ _id: { $ne: template._id } }, { properties: { $elemMatch: { $or: [...condition] } } }],
  };
  return model.get(query);
}

function filterInconsistentProperties(template: TemplateSchema, allProperties: PropertySchema[]) {
  return ensure<PropertySchema[]>(template.properties).reduce(
    (propertyNames: string[], property) => {
      const matches = allProperties.find(
        p =>
          p.name === property.name &&
          (p.content !== property.content ||
            !getCompatibleTypes(property.type).includes(p.type) ||
            p.relationType !== property.relationType ||
            p.inherit?.type !== property.inherit?.type)
      );

      if (matches && !propertyNames.includes(ensure(property.name))) {
        return propertyNames.concat([ensure(property.name)]);
      }

      return propertyNames;
    },
    []
  );
}

ajv.addKeyword({
  keyword: 'cantReuseNameWithDifferentType',
  async: true,
  errors: true,
  type: 'object',
  async validate(_schema: any, template: TemplateSchema) {
    if (!template.properties || template.properties.length === 0) {
      return true;
    }
    const matchedTemplates = await getPropertiesWithSameNameAndDifferentKind(template);
    if (matchedTemplates.length > 0) {
      const allProperties: PropertySchema[] = matchedTemplates.reduce(
        (memo: PropertySchema[], t) => memo.concat(t.properties || []),
        []
      );

      const errorProperties = filterInconsistentProperties(template, allProperties);

      throw new Ajv.ValidationError(
        errorProperties.map(property => ({
          keyword: 'cantReuseNameWithDifferentType',
          schemaPath: '',
          params: { keyword: 'cantReuseNameWithDifferentType' },
          message:
            'Entered label is already in use on another property with a different type, thesaurus or inherit',
          instancePath: `.properties.${property}`,
        }))
      );
    }

    return true;
  },
});

ajv.addKeyword({
  keyword: 'entityViewPageExistsAndIsEnabled',
  async: true,
  errors: true,
  type: 'object',
  async validate(fields: any, template: TemplateSchema) {
    if (template.entityViewPage) {
      const page = await pages.get({
        sharedId: template.entityViewPage,
      });
      if (page.length === 0) {
        throw new Ajv.ValidationError([
          {
            keyword: 'entityViewPageExists',
            schemaPath: '',
            params: { keyword: 'entityViewPageExists', fields },
            message: 'The selected page does not exist',
            instancePath: '.templates',
          },
        ]);
      }
      if (!page[0].entityView) {
        throw new Ajv.ValidationError([
          {
            keyword: 'entityViewPageIsEnabled',
            schemaPath: '',
            params: { keyword: 'entityViewPageIsEnabled', fields },
            message: 'The selected page is not enabled for entity view',
            instancePath: '.templates',
          },
        ]);
      }
      return true;
    }
    return true;
  },
});

export const templateSchema = {
  $schema: 'http://json-schema.org/schema#',
  $async: true,
  type: 'object',
  uniqueName: true,
  cantDeleteInheritedProperties: true,
  cantReuseNameWithDifferentType: true,
  entityViewPageExistsAndIsEnabled: true,
  required: ['name'],
  uniquePropertyFields: ['id', 'name'],
  definitions: { objectIdSchema, propertySchema },
  properties: {
    _id: objectIdSchema,
    name: { type: 'string', minLength: 1 },
    color: { type: 'string', default: '' },
    default: { type: 'boolean', default: false },
    entityViewPage: { type: 'string', default: '' },
    synced: { type: 'boolean' },
    commonProperties: {
      type: 'array',
      requireTitleProperty: true,
      minItems: 1,
      items: propertySchema,
    },
    properties: {
      type: 'array',
      items: propertySchema,
    },
  },
};

const validateTemplate = wrapValidator(ajv.compile(templateSchema));
export { validateTemplate, getCompatibleTypes };
