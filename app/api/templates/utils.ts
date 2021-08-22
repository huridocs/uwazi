import uuid from 'node-uuid';
import { ObjectID } from 'mongodb';
import { differenceBy } from 'lodash';

import settings from 'api/settings/settings';
import { files } from 'api/files';
import propertiesHelper from 'shared/comonProperties';
import { safeName as sharedSafeName } from 'shared/propertyNames';
import { ensure } from 'shared/tsUtils';
import { PropertySchema } from 'shared/types/commonTypes';
import { TemplateSchema } from 'shared/types/templateType';
import { ThesaurusValueSchema } from 'shared/types/thesaurusType';
import model from './templatesModel';

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

export function getRenamedTitle(
  oldCommonProperties: PropertySchema[],
  newCommonProperties: PropertySchema[]
) {
  const oldTitle = ensure<PropertySchema>(oldCommonProperties.find(p => p.name === 'title'));
  const newTitle = ensure<PropertySchema>(newCommonProperties.find(p => p.name === 'title'));
  return oldTitle.label !== newTitle.label ? [oldTitle.label] : [];
}

export const removeExtractedMetadata = async (
  oldProperties: PropertySchema[] = [],
  newProperties: PropertySchema[] = []
) => {
  const hasRemovedProperties = oldProperties.length > newProperties.length;
  let removedProperties: PropertySchema[] = [];

  if (hasRemovedProperties) {
    const difference = differenceBy(oldProperties, newProperties, 'name');
    removedProperties = difference.filter(property =>
      ['text', 'markdown', 'numeric', 'date'].includes(property.type)
    );
  }
  if (removedProperties.length > 0) {
    return removedProperties.reduce(async (previousPromise: Promise<void>, property) => {
      await previousPromise;
      const affectedFiles = await files.get({
        'extractedMetadata.propertyID': property._id?.toString(),
      });

      await affectedFiles.reduce(async (prevPromise: Promise<void>, file) => {
        await prevPromise;
        await files.save({
          ...file,
          extractedMetadata: file.extractedMetadata?.filter(
            data => data.propertyID !== property._id?.toString()
          ),
        });
      }, Promise.resolve());
    }, Promise.resolve());
  }

  return null;
};
