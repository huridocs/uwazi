import uuid from 'node-uuid';

const generateName = (property) => {
  const name = property.label ? property.label.trim().replace(/[^a-z0-9]/gi, '_').toLowerCase() : property.name;
  return `${name}_${property.type}`;
};

export function generateNames(properties) {
  return properties.map(property => ({
    ...property,
    name: generateName(property)
  }));
}

export function generateIds(properties = []) {
  return properties.map(property => ({
    ...property,
    id: property.id || uuid.v4()
  }));
}

export function generateNamesAndIds(_properties = []) {
  const properties = generateNames(_properties);
  return generateIds(properties);
}

const flattenProperties = properties => properties.reduce((flatProps, p) => {
  if (p.values) {
    return flatProps.concat(p.values);
  }
  return flatProps.concat(p);
}, []);

export function getUpdatedNames(oldProperties = [], newProperties, prop = 'name') {
  const propertiesWithNewName = {};

  flattenProperties(oldProperties).forEach((property) => {
    const newProperty = flattenProperties(newProperties)
    .find(p => p.id === property.id);

    if (newProperty && newProperty[prop] !== property[prop]) {
      propertiesWithNewName[property[prop]] = newProperty[prop];
    }
  });

  return propertiesWithNewName;
}

const includedIn = propertyCollection => property => !propertyCollection.find(p => p.id === property.id);

export function getDeletedProperties(oldProperties = [], newProperties, prop = 'name') {
  return flattenProperties(oldProperties)
  .filter(includedIn(flattenProperties(newProperties)))
  .map(property => property[prop]);
}
