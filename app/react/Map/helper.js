/* eslint-disable max-statements */
/** @format */

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

const getMarkersBoudingBox = markers =>
  markers.reduce(
    (_b, marker) => {
      const b = _b.slice();
      if (!b[0][0] || marker.longitude < b[0][0]) {
        b[0][0] = marker.longitude;
      }
      if (!b[1][0] || marker.longitude > b[1][0]) {
        b[1][0] = marker.longitude;
      }
      if (!b[1][1] || marker.latitude > b[1][1]) {
        b[1][1] = marker.latitude;
      }
      if (!b[0][1] || marker.latitude < b[0][1]) {
        b[0][1] = marker.latitude;
      }
      return b;
    },
    [
      [null, null],
      [null, null],
    ]
  );

const markersToStyleFormat = markers =>
  markers.map((marker, index) => {
    const properties = marker.properties || {};
    const { longitude, latitude } = marker;
    properties.index = index;
    return {
      type: 'Feature',
      properties,
      geometry: {
        type: 'Point',
        coordinates: [longitude, latitude],
      },
    };
  });

const noop = () => {};

const extractMarkers = ({ entity, geolocationProps, metadata, color, type }) => {
  const markers = [];
  const geolocationPropNames = geolocationProps.map(prop => prop.get('name'));

  if (geolocationProps.size && metadata) {
    const [...properties] = metadata.keys();
    properties.forEach(property => {
      if (geolocationPropNames.includes(property) && metadata.has(property)) {
        const geolocationProp = geolocationProps.find(p => p.get('name') === property);
        const propertyMetadata = metadata.get(property);
        if (type === 'PropertyBased') {
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
        } else {
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

const getInheritedMarkers = (template, entity, templates) => {
  const templateProperties = template.get('properties');
  const color = template.get('color');
  const metadata = entity.get('metadata');

  const geolocationProps = templateProperties.filter(property => {
    if (property.get('type') === 'relationship' && property.has('inheritProperty')) {
      const contentTemplate = templates.find(
        t => t.get('_id').toString() === property.get('content').toString()
      );
      const inheritedProperty = contentTemplate
        .get('properties')
        .find(p => p.get('_id').toString() === property.get('inheritProperty').toString());
      return inheritedProperty.get('type') === 'geolocation';
    }
    return false;
  });

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

const TRANSITION_PROPS = {
  transitionDuration: 0,
  transitionEasing: t => t,
  transitionInterruption: 1,
  onTransitionStart: noop,
  onTransitionInterrupt: noop,
  onTransitionEnd: noop,
  onViewportChange: noop,
  onStateChange: noop,
};

export { getMarkersBoudingBox, markersToStyleFormat, getMarkers, TRANSITION_PROPS };
