import uuid from 'node-uuid';

export function generateNames(properties) {
  let newCounts = properties.reduce((memo, property) => {
    if (property.name) {
      const baseName = property.name.split('--')[0];
      const nameCount = property.name.split('--')[1] || 0;
      if (!memo[baseName]) {
        memo[baseName] = Number(nameCount) || 1;
      }
      else {
        memo[baseName] = Math.max(memo[baseName]+1, Number(nameCount)+1);
      }
    }
    return memo;
  }, {});

  return properties.map((property) => {
    if (property.name) {
      return property;
    }
    property.name = property.label.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    if (newCounts[property.name]) {
      property.name = property.name + '--' + newCounts[property.name];
    }
    return property;
  });
}

export function generateIds(properties) {
  return properties.map((property) => {
    if (!property.id) {
      property.id = uuid.v4();
    }
    return property;
  });
}

export function generateNamesAndIds(_properties) {
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
