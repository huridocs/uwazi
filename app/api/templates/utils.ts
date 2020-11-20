import uuid from 'node-uuid';
import { PropertySchema } from 'shared/types/commonTypes';
import settings from 'api/settings/settings';
import { ThesaurusValueSchema } from 'shared/types/thesaurusType';

const generateNewSafeName = (label: string) =>
  label
    .trim()
    .replace(/[#|\\|/|*|?|"|<|>|=|||\s|:|.]/gi, '_')
    .replace(/^[_|\-|+|$]/, '')
    .toLowerCase();

export const safeName = (label: string, newNameGeneration: boolean = false) => {
  if (newNameGeneration) {
    return generateNewSafeName(label);
  }
  return label
    .trim()
    .replace(/[^a-z0-9]/gi, '_')
    .toLowerCase();
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
      return [...flatProps, ...p.values];
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
