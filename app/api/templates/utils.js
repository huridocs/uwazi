import uuid from 'node-uuid';

export function generateNames(properties) {
  return properties.map((property) => {
    property.name = property.label ? property.label.trim().replace(/[^a-z0-9]/gi, '_').toLowerCase() : property.name;
    if (property.type === 'geolocation') {
      property.name += '_geolocation';
    }
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
  const properties = generateNames(_properties);
  return generateIds(properties);
}

const deepFind = (collection, matchFunction) => {
  let match = collection.find(matchFunction);
  if (match) {
    return match;
  }
  collection.forEach((item) => {
    if (item.values) {
      match = item.values.find(matchFunction);
    }
  });

  return match;
};

export function getUpdatedNames(oldProperties = [], newProperties, prop = 'name') {
  const propertiesWithNewName = {};
  const getUpdatedName = (property) => {
    const newProperty = deepFind(newProperties, p => p.id === property.id);
    if (newProperty && newProperty[prop] !== property[prop]) {
      propertiesWithNewName[property[prop]] = newProperty[prop];
    }
  };

  oldProperties.forEach((property) => {
    getUpdatedName(property);
    if (property.values) {
      property.values.forEach(getUpdatedName);
    }
  });

  return propertiesWithNewName;
}

export function getDeletedProperties(oldProperties = [], newProperties, prop = 'name') {
  const deletedProperties = [];
  const checkDeleted = (property) => {
    const newProperty = deepFind(newProperties, p => p.id === property.id);
    if (!newProperty) {
      deletedProperties.push(property[prop]);
    }
  };

  oldProperties.forEach((property) => {
    checkDeleted(property);
    if (property.values) {
      property.values.forEach(checkDeleted);
    }
  });

  return deletedProperties;
}
