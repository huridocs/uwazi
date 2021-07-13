import uuid from 'node-uuid';
import settings from 'api/settings/settings';
import { PropertySchema } from 'shared/types/commonTypes';
import { ThesaurusValueSchema } from 'shared/types/thesaurusType';
import { TemplateSchema } from 'shared/types/templateType';
import propertiesHelper from 'shared/comonProperties';
import { ObjectID } from 'mongodb';
import model from './templatesModel';

import { safeName as sharedSafeName } from 'shared/propertyNames';

export const safeName = sharedSafeName;

const getInheritedProps = async (templates: TemplateSchema[]) => {
  const properties: PropertySchema[] = propertiesHelper
    .allUniqueProperties(templates)
    .filter((p: PropertySchema) => p.inherit?.property);

  return (
    await model.db.aggregate([
      {
        $match: {
          'properties._id': {
            $in: properties.map(p => new ObjectID(p.inherit?.property)),
          },
        },
      },
      {
        $project: {
          properties: {
            $filter: {
              input: '$properties',
              as: 'property',
              cond: {
                $or: properties.map(p => ({
                  $eq: ['$$property._id', new ObjectID(p.inherit?.property)],
                })),
              },
            },
          },
          _id: 0,
        },
      },
      { $unwind: '$properties' },
      { $replaceRoot: { newRoot: '$properties' } },
    ])
  ).reduce((indexed, prop) => ({ ...indexed, [prop._id.toString()]: prop }), {});
};

export const denormalizeInheritedProperties = async (template: TemplateSchema) => {
  const inheritedProperties: { [k: string]: PropertySchema } = await getInheritedProps([template]);

  return template.properties?.map(prop => {
    if (!prop.inherit?.property) {
      delete prop.inherit;
      return prop;
    }

    const { type } = inheritedProperties[prop.inherit.property];
    // eslint-disable-next-line no-param-reassign
    prop.inherit.type = type;
    return prop;
  });
};

const generateName = (property: PropertySchema, newNameGeneration: boolean) => {
  const name = property.label ? safeName(property.label, newNameGeneration) : property.name;
  return property.type === 'geolocation' || property.type === 'nested'
    ? `${name}_${property.type}`
    : name;
};

const generateNames = (properties: PropertySchema[], newNameGeneration: boolean) =>
  properties.map(property => ({
    ...property,
    name: generateName(property, newNameGeneration),
  }));

export function generateIds(properties: PropertySchema[] = []) {
  return properties.map(property => ({
    ...property,
    id: property.id || uuid.v4(),
  }));
}

export const generateNamesAndIds = async (properties: PropertySchema[] = []) => {
  const { newNameGeneration = false } = await settings.get();
  return generateIds(generateNames(properties, newNameGeneration));
};

export interface PropertyOrThesaurusSchema
  extends Partial<PropertySchema>,
    Partial<ThesaurusValueSchema> {}

const flattenProperties = (properties: PropertyOrThesaurusSchema[]) =>
  properties.reduce<PropertyOrThesaurusSchema[]>((flatProps, p) => {
    if (p.values) {
      return [...flatProps, ...p.values, p];
    }

    return [...flatProps, p];
  }, []);

export function getUpdatedNames(
  oldProperties: PropertyOrThesaurusSchema[] = [],
  newProperties: PropertyOrThesaurusSchema[],
  prop: 'name' | 'label' = 'name',
  outKey: 'name' | 'label' = prop
) {
  const propertiesWithNewName: { [k: string]: string | undefined } = {};
  flattenProperties(oldProperties).forEach(property => {
    const newProperty = flattenProperties(newProperties).find(p => p.id === property.id);
    if (newProperty && newProperty[prop] !== property[prop]) {
      const key = property[outKey];
      if (key) {
        propertiesWithNewName[key] = newProperty[prop];
      }
    }
  });

  return propertiesWithNewName;
}

const notIncludedIn = (propertyCollection: PropertyOrThesaurusSchema[]) => (
  property: PropertyOrThesaurusSchema
) => !propertyCollection.find(p => p.id === property.id);

export function getDeletedProperties(
  oldProperties: PropertyOrThesaurusSchema[] = [],
  newProperties: PropertyOrThesaurusSchema[],
  prop: 'name' | 'label' = 'name'
) {
  return flattenProperties(oldProperties)
    .filter(notIncludedIn(flattenProperties(newProperties)))
    .map(property => property[prop]);
}
