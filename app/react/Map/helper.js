const _mergeArrays = (first, second) => {
  let bigArray;
  let smallArray;
  if (first.length > second.length) {
    bigArray = first;
    smallArray = second;
  } else {
    bigArray = second;
    smallArray = first;
  }

  smallArray.forEach(item => bigArray.push(item));
  return bigArray;
};

const extractPropertyBasedMarkers = (entity, geolocationProp, propertyMetadata, color) => {
  const markers = [];
  propertyMetadata
    .filter(mo => mo.get('value'))
    .forEach(point => {
      markers.push({
        properties: { entity: entity.toJS(), color, info: point.getIn(['value', 'label']) },
        latitude: point.getIn(['value', 'lat']),
        longitude: point.getIn(['value', 'lon']),
        label: geolocationProp.get('label'),
      });
    });
  return markers;
};

const extractInheritedMarkers = (entity, geolocationProp, propertyMetadata, color) => {
  const markers = [];
  propertyMetadata.forEach(relatedProperty => {
    if (relatedProperty.has('inherit_geolocation')) {
      // conditional is a quick hack to prevent app crash
      relatedProperty
        .get('inherit_geolocation')
        .filter(mo => mo.get('value'))
        .forEach(point => {
          markers.push({
            properties: {
              entity: entity.toJS(),
              color,
              info: point.getIn(['value', 'label']),
              inherited: true,
              label: relatedProperty.get('label'),
              context: geolocationProp.get('content'),
            },
            latitude: point.getIn(['value', 'lat']),
            longitude: point.getIn(['value', 'lon']),
            label: geolocationProp.get('label'),
          });
        });
    }
  });
  return markers;
};

const extractMarkers = ({ entity, geolocationProps, metadata, color, type }) => {
  let markers = [];
  const geolocationPropNames = geolocationProps.map(prop => prop.get('name'));

  if (geolocationProps.size && metadata) {
    const [...properties] = metadata.keys();
    properties.forEach(property => {
      if (geolocationPropNames.includes(property) && metadata.has(property)) {
        const geolocationProp = geolocationProps.find(p => p.get('name') === property);
        const propertyMetadata = metadata.get(property);
        if (type === 'PropertyBased') {
          markers = _mergeArrays(
            markers,
            extractPropertyBasedMarkers(entity, geolocationProp, propertyMetadata, color)
          );
        } else {
          markers = _mergeArrays(
            markers,
            extractInheritedMarkers(entity, geolocationProp, propertyMetadata, color)
          );
        }
      }
    });
  }
  return markers;
};

const getPropertyBasedMarkers = (template, entity) => {
  const color = template.get('color');
  const templateProperties = template.get('properties');
  const metadata = entity.get('metadata');

  const geolocationProps = templateProperties.filter(
    property => property.get('type') === 'geolocation'
  );

  return extractMarkers({ entity, geolocationProps, metadata, color, type: 'PropertyBased' });
};

const getInheritedMarkers = (template, entity) => {
  const templateProperties = template.get('properties');
  const color = template.get('color');
  const metadata = entity.get('metadata');

  const geolocationProps = templateProperties.filter(
    property => property.getIn(['inherit', 'type']) === 'geolocation'
  );

  return extractMarkers({ entity, geolocationProps, metadata, color, type: 'Inherited' });
};

const getEntityMarkers = (entity, templates) => {
  const template = templates.find(_t => _t.get('_id') === entity.get('template'));

  const propertyBasedMarkers = getPropertyBasedMarkers(template, entity);
  const inheritedMarkers = getInheritedMarkers(template, entity, templates);

  return _mergeArrays(propertyBasedMarkers, inheritedMarkers);
};

const getMarkers = (entities, templates) => {
  const m = entities.reduce((markers, entity) => {
    const entityMarkers = getEntityMarkers(entity, templates);
    return _mergeArrays(markers, entityMarkers);
  }, []);
  return m;
};

export { getMarkers };
