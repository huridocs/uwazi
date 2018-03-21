import uuid from 'node-uuid';

export function generateNames(properties) {
  return properties.map((property) => {
    property.name = property.label ? property.label.replace(/[^a-z0-9]/gi, '_').toLowerCase() : property.name;
    return property;
  });
}

export function generateIds(properties = []) {
  return properties.map((property) => {
    if (!property.id) {
      property.id = uuid.v4();
    }
    return property;
  });
}

export function generateNamesAndIds(_properties = []) {
  let properties = generateNames(_properties);
  return generateIds(properties);
}

export function getUpdatedNames(oldProperties = [], newProperties, prop = 'name') {
  let propertiesWithNewName = {};
  oldProperties.forEach((property) => {
    let newProperty = newProperties.find((p) => p.id === property.id);
    if (newProperty && newProperty[prop] !== property[prop]) {
      propertiesWithNewName[property[prop]] = newProperty[prop];
    }
  });

  return propertiesWithNewName;
}

export function getDeletedProperties(oldProperties = [], newProperties, prop = 'name') {
  let deletedProperties = [];

  oldProperties.forEach((property) => {
    let newProperty = newProperties.find((p) => p.id === property.id);
    if (!newProperty) {
      deletedProperties.push(property[prop]);
    }
  });

  return deletedProperties;
}
