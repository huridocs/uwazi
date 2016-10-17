import uuid from 'node-uuid';

export function generateNamesAndIds(properties) {
  return properties.map((property) => {
    property.name = property.label.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    if (!property.id) {
      property.id = uuid.v4();
    }
    return property;
  });
}

export function getUpdatedNames(oldProperties = [], newProperties, prop = 'name') {
  let propertiesWithNewName = {};
  oldProperties.forEach((property) => {
    let newProperty = newProperties.find((p) => p.id === property.id);
    if (newProperty && newProperty.name !== property.name) {
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
