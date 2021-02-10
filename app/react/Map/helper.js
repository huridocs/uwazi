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

const getPropertyBasedMarkers = (template, entity) => {
  const markers = [];
  const color = template.get('color');
  const templateProperties = template.get('properties');
  const metadata = entity.get('metadata');

  const geolocationProps = [];
  templateProperties.forEach(property => {
    if (property.get('type') === 'geolocation') {
      geolocationProps.push(property);
    }
  });

  const geolocationPropNames = geolocationProps.map(prop => prop.get('name'));

  if (geolocationProps.length && metadata) {
    const [...properties] = metadata.keys();
    properties.forEach(property => {
      if (geolocationPropNames.includes(property) && metadata[property]) {
        const label = geolocationProps.find(p => p.get('name') === property).get('label');
        metadata[property]
          .filter(mo => mo.value)
          .forEach(({ value: point }) => {
            const { lat, lon } = point;
            markers.push({
              properties: { entity, color, info: point.label },
              latitude: lat,
              longitude: lon,
              label,
            });
          });
      }
    });
  }

  return markers;
};

const getInheritedMarkers = (template, entity, templates) => {
  const markers = [];
  const templateProperties = template.get('properties');
  const color = template.get('color');
  const metadata = entity.get('metadata');

  const inheritedGeolocationProps = [];
  templateProperties.forEach(property => {
    if (property.get('type') === 'relationship' && property.get('inheritProperty')) {
      const contentTemplate = templates.find(
        t => t.get('_id').toString() === property.get('content').toString()
      );
      const inheritedProperty = contentTemplate
        .get('properties')
        .find(p => p.get('_id').toString() === property.get('inheritProperty').toString());
      if (inheritedProperty.get('type') === 'geolocation') {
        inheritedGeolocationProps.push(inheritedProperty);
      }
    }
  });

  const inheritedGeolocationPropNames = inheritedGeolocationProps.map(p => p.get('name'));

  if (inheritedGeolocationProps.length && metadata) {
    const [...metadataProperties] = metadata.keys();
    metadataProperties.forEach(property => {
      if (inheritedGeolocationPropNames.includes(property) && metadata[property]) {
        const { label, content: context } = inheritedGeolocationProps.find(
          p => p.name === property
        );
        metadata[property].forEach(relatedProperty => {
          if (relatedProperty.inherit_geolocation) {
            // conditional is a quick hack to prevent app crash
            relatedProperty
              .get('inherit_geolocation')
              .filter(mo => mo.value)
              .forEach(({ value: point }) => {
                const { lat, lon } = point;
                const properties = {
                  entity,
                  color,
                  info: point.label,
                  inherited: true,
                  label: relatedProperty.label,
                  context,
                };
                markers.push({ properties, latitude: lat, longitude: lon, label });
              });
          }
        });
      }
    });
  }

  return markers;
};

const getEntityMarkers = (entity, templates) => {
  const template = templates.find(_t => _t.get('_id') === entity.get('template'));

  const propertyBasedMarkers = getPropertyBasedMarkers(template, entity);
  const inheritedMarkers = getInheritedMarkers(template, entity, templates);

  return _mergeArrays(propertyBasedMarkers, inheritedMarkers);
};

const getMarkers = (entities, templates) => {
  const markers = [];
  console.time('Markers');
  entities.forEach(entity => {
    const entityMarkers = getEntityMarkers(entity, templates); //).toJS().filter(m => m);
    markers.push(entityMarkers);
  });
  console.timeEnd('Markers');
  return markers;
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
