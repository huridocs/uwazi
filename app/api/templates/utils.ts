import uuid from 'node-uuid';
import { ObjectId } from 'mongodb';
import { differenceBy, intersectionBy } from 'lodash';

import settings from 'api/settings/settings';
import { files } from 'api/files';
import propertiesHelper from 'shared/comonProperties';
import { objectIndex } from 'shared/data_utils/objectIndex';
import { safeName as sharedSafeName } from 'shared/propertyNames';
import { ensure } from 'shared/tsUtils';
import { ExtractedMetadataSchema, PropertySchema } from 'shared/types/commonTypes';
import { TemplateSchema } from 'shared/types/templateType';
import { ThesaurusSchema, ThesaurusValueSchema } from 'shared/types/thesaurusType';
import model from './templatesModel';

const safeName = sharedSafeName;

const getInheritedProps = async (templates: TemplateSchema[]) => {
  const properties: PropertySchema[] = propertiesHelper
    .allUniqueProperties(templates)
    .filter((p: PropertySchema) => p.inherit?.property);

  return (
    await model.db.aggregate([
      {
        $match: {
          'properties._id': {
            $in: properties.map(p => new ObjectId(p.inherit?.property)),
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
                  $eq: ['$$property._id', new ObjectId(p.inherit?.property)],
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

const denormalizeInheritedProperties = async (template: TemplateSchema) => {
  if (template.synced) return template.properties;

  const inheritedProperties: { [k: string]: PropertySchema } = await getInheritedProps([template]);

  return template.properties?.map(prop => {
    if (!prop.inherit?.property) {
      // eslint-disable-next-line no-param-reassign
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

const generateNames = async (properties: PropertySchema[]) => {
  const { newNameGeneration = false } = await settings.get();
  return properties.map(property => ({
    ...property,
    name: generateName(property, newNameGeneration),
  }));
};

const newThesauriId = () => uuid.v4();

function generateIds(properties: ThesaurusSchema[] = []) {
  return properties.map(property => ({
    ...property,
    id: property.id || newThesauriId(),
  }));
}
interface PropertyOrThesaurusSchema
  extends Partial<PropertySchema>,
    Partial<ThesaurusValueSchema> {}

const flattenProperties = (properties: PropertyOrThesaurusSchema[]) =>
  properties.reduce<PropertyOrThesaurusSchema[]>((flatProps, p) => {
    if (p.values) {
      return [...flatProps, ...p.values, p];
    }

    return [...flatProps, p];
  }, []);

function getUpdatedIds(
  {
    prop,
    filterBy,
  }: {
    prop: 'name' | 'label';
    filterBy: 'id' | '_id';
  },
  oldProperties: PropertyOrThesaurusSchema[] = [],
  newProperties: PropertyOrThesaurusSchema[] = []
) {
  const indexOf = (p: PropertyOrThesaurusSchema) => p[filterBy]!.toString();
  const idsWithNewName: { [k: string]: string } = {};
  const flatOld = flattenProperties(oldProperties);
  const flatNew = flattenProperties(newProperties);
  const newByIndex = objectIndex(flatNew, indexOf, p => p);
  flatOld.forEach(property => {
    const newProperty = newByIndex[indexOf(property)];
    const oldValue = property[prop];
    const newValue = newProperty?.[prop];
    if (newProperty && typeof newValue === 'string' && newValue !== oldValue) {
      idsWithNewName[indexOf(property)] = newValue;
    }
  });
  return idsWithNewName;
}

function getUpdatedNames(
  {
    prop,
    filterBy,
  }: {
    prop: 'name' | 'label';
    filterBy: 'id' | '_id';
  },
  oldProperties: PropertyOrThesaurusSchema[] = [],
  newProperties: PropertyOrThesaurusSchema[] = []
) {
  const indexOf = (p: PropertyOrThesaurusSchema) => p[filterBy]?.toString() || '';

  const propertiesWithNewName: { [k: string]: string } = {};
  const deletedProperties: Set<string> = new Set();

  const flatOld = flattenProperties(oldProperties);
  const preExistingLabels = new Set(flatOld.map(property => property[prop]));
  const flatNew = flattenProperties(newProperties);
  const newByIndex = objectIndex(flatNew, indexOf, p => p);
  const allNewLabels = new Set(flatNew.map(property => property[prop]));

  const labelAlreadyExisted = (p: PropertyOrThesaurusSchema) => preExistingLabels.has(p[prop]);
  const labelStillInUse = (p: PropertyOrThesaurusSchema) => allNewLabels.has(p[prop]);
  const sameProp = (previous: PropertyOrThesaurusSchema, current: PropertyOrThesaurusSchema) =>
    previous[prop] === current[prop];
  const compareProps = (
    previous: PropertyOrThesaurusSchema,
    current: PropertyOrThesaurusSchema
  ) => {
    if (!current || sameProp(previous, current) || labelAlreadyExisted(current)) {
      if (!labelStillInUse(previous)) deletedProperties.add(previous[prop]!);
      return { key: undefined, value: undefined };
    }
    if (labelStillInUse(previous)) {
      return { key: current[prop], value: current[prop] };
    }
    return { key: previous[prop], value: current[prop] };
  };

  flatOld.forEach(property => {
    const newProperty = newByIndex[indexOf(property)];
    const { key, value } = compareProps(property, newProperty);
    if (key && value) {
      propertiesWithNewName[key] = value;
    }
  });

  return { update: propertiesWithNewName, delete: Array.from(deletedProperties) };
}

function getDeletedProperties(
  oldProperties: PropertyOrThesaurusSchema[] = [],
  newProperties: PropertyOrThesaurusSchema[] = [],
  filterBy: 'id' | '_id' = '_id',
  prop: 'name' | 'label' | 'id' = 'name'
) {
  const flatOld = flattenProperties(oldProperties);
  const flatNew = flattenProperties(newProperties);
  const newIds = new Set(flatNew.map(property => property[filterBy]?.toString()));
  const newLabels = new Set(flatNew.map(property => property[prop]?.toString()));
  const filteredById = flatOld
    .filter(
      property => !newIds.has(property[filterBy]?.toString()) && !newLabels.has(property[prop])
    )
    .filter((property): property is { [k: string]: string } => typeof property[prop] === 'string')
    .map(property => property[prop]);
  return filteredById;
}

function getRenamedTitle(
  oldCommonProperties: PropertySchema[],
  newCommonProperties: PropertySchema[]
) {
  const oldTitle = ensure<PropertySchema>(oldCommonProperties.find(p => p.name === 'title'));
  const newTitle = ensure<PropertySchema>(newCommonProperties.find(p => p.name === 'title'));
  return oldTitle.label !== newTitle.label ? [oldTitle.label] : [];
}

const propertyUpdater = async (
  modifiedProperties: PropertySchema[] = [],
  updateFunction: (
    array: ExtractedMetadataSchema[],
    property: PropertySchema
  ) => ExtractedMetadataSchema[] = () => []
) =>
  modifiedProperties.reduce(async (previousPromise: Promise<void>, property) => {
    await previousPromise;
    const affectedFiles = await files.get({
      'extractedMetadata.propertyID': property._id?.toString(),
    });

    await affectedFiles.reduce(async (prevPromise: Promise<void>, file) => {
      await prevPromise;
      await files.save({
        ...file,
        extractedMetadata: updateFunction(file.extractedMetadata || [], property),
      });
    }, Promise.resolve());
  }, Promise.resolve());

const updateExtractedMetadataProperties = async (
  oldProperties: PropertySchema[] = [],
  newProperties: PropertySchema[] = []
) => {
  const currentProperties = oldProperties.map(property => ({
    ...property,
    _id: property._id?.toString(),
  }));

  const differentProperties = differenceBy(newProperties, currentProperties, 'name').filter(
    property => ['text', 'markdown', 'numeric', 'date'].includes(property.type)
  );

  const renamedProperties = intersectionBy(differentProperties, currentProperties, '_id');

  const removedProperties = differenceBy(currentProperties, newProperties, '_id').filter(property =>
    ['text', 'markdown', 'numeric', 'date'].includes(property.type)
  );

  if (removedProperties.length > 0) {
    await propertyUpdater(removedProperties, (metadata, property) =>
      metadata.filter(data => data.propertyID !== property._id?.toString())
    );
  }

  if (renamedProperties.length > 0) {
    await propertyUpdater(renamedProperties, (metadata, property) =>
      metadata.map(data => {
        if (data.propertyID === property._id?.toString()) {
          return { ...data, name: property.name };
        }
        return data;
      })
    );
  }

  return null;
};

export type { PropertyOrThesaurusSchema };
export {
  newThesauriId,
  safeName,
  denormalizeInheritedProperties,
  flattenProperties,
  generateIds,
  getUpdatedIds,
  getUpdatedNames,
  generateNames,
  getDeletedProperties,
  getRenamedTitle,
  updateExtractedMetadataProperties,
};
