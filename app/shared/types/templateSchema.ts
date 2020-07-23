import Ajv from 'ajv';
import model from 'api/templates/templatesModel';
import { ensure, wrapValidator } from 'shared/tsUtils';
import { objectIdSchema, propertySchema } from 'shared/types/commonSchemas';
import templates from 'api/templates';

import { TemplateSchema } from './templateType';
import { PropertySchema } from './commonTypes';
import { ObjectId } from 'mongodb';

export const emitSchemaTypes = true;

const ajv = Ajv({ allErrors: true });

ajv.addKeyword('uniqueName', {
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

ajv.addKeyword('requireTitleProperty', {
  errors: false,
  type: 'array',
  validate(_schema: any, properties: PropertySchema[]) {
    return properties.some(prop => prop.name === 'title');
  },
});

ajv.addKeyword('uniquePropertyFields', {
  errors: false,
  type: 'object',
  validate(fields: string[], data: TemplateSchema) {
    const uniqueValues: { [k: string]: Set<string> } = fields.reduce(
      (memo, field) => ({ ...memo, [field]: new Set() }),
      {}
    );

    const allProperties = (data.properties || []).concat(data.commonProperties || []);

    const errors: Ajv.ErrorObject[] = [];
    allProperties.forEach(property => {
      fields.forEach(field => {
        const value = property[field] && property[field].toLowerCase().trim();
        if (value && uniqueValues[field].has(value)) {
          errors.push({
            keyword: 'uniquePropertyFields',
            schemaPath: '',
            params: { keyword: 'uniquePropertyFields', fields },
            message: `duplicated property value { ${field}: "${value}" }`,
            dataPath: `.properties.${field}`,
          });
        }
        uniqueValues[field].add(value);
      });
    });

    if (errors.length) {
      throw new Ajv.ValidationError(errors);
    }

    return true;
  },
});

ajv.addKeyword('requireContentForSelectFields', {
  errors: false,
  type: 'object',
  validate(schema: any, data: TemplateSchema) {
    if (!schema) {
      return true;
    }
    if (['multiselect', 'select'].includes(data.type)) {
      return !!(data.content && data.content.length);
    }

    return true;
  },
});

ajv.addKeyword('requireRelationTypeForRelationship', {
  errors: false,
  type: 'object',
  validate(schema: any, data: TemplateSchema) {
    if (!schema) {
      return true;
    }
    if (data.type === 'relationship') {
      return !!(data.relationType && data.relationType.length);
    }
    return true;
  },
});

ajv.addKeyword('requireInheritPropertyForInheritingRelationship', {
  errors: false,
  type: 'object',
  validate(schema: any, data: TemplateSchema) {
    if (!schema) {
      return true;
    }
    if (data.type === 'relationship' && data.inherit) {
      return !!data.inheritProperty;
    }
    return true;
  },
});

ajv.addKeyword('cantDeleteInheritedProperties', {
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
        !(template.properties || []).find(p => p._id && p._id.toString() === prop._id.toString())
    );

    const errors: Ajv.ErrorObject[] = [];
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
            dataPath: `.properties.${property.name}`,
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
            p.type !== property.type ||
            p.relationType !== property.relationType)
      );

      if (matches && !propertyNames.includes(ensure(property.name))) {
        return propertyNames.concat([ensure(property.name)]);
      }

      return propertyNames;
    },
    []
  );
}

ajv.addKeyword('cantReuseNameWithDifferentType', {
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
            'Entered label is already in use on another property with a different type or thesaurus',
          dataPath: `.properties.${property}`,
        }))
      );
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
  required: ['name'],
  uniquePropertyFields: ['id', 'name'],
  definitions: { objectIdSchema, propertySchema },
  properties: {
    _id: objectIdSchema,
    name: { type: 'string', minLength: 1 },
    color: { type: 'string', default: '' },
    default: { type: 'boolean', default: false },
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
export { validateTemplate };
