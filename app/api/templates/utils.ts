import uuid from 'node-uuid';

import settings from 'api/settings/settings';
import { objectIndex } from 'shared/data_utils/objectIndex';
import { safeName as sharedSafeName } from 'shared/propertyNames';
import { PropertySchema } from 'shared/types/commonTypes';
import { ThesaurusSchema, ThesaurusValueSchema } from 'shared/types/thesaurusType';

const safeName = sharedSafeName;

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

export type { PropertyOrThesaurusSchema };
export {
  newThesauriId,
  safeName,
  flattenProperties,
  generateIds,
  getUpdatedIds,
  getUpdatedNames,
  generateNames,
  getDeletedProperties,
};
