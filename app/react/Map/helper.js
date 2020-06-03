/** @format */

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

const getPropertyBasedMarkers = (template, entity, color) => {
  const markers = [];

  const geolocationProps = template.properties.filter(p => p.type === 'geolocation');
  const geolocationPropNames = geolocationProps.map(p => p.name);

  if (geolocationProps.length && entity.metadata) {
    Object.keys(entity.metadata).forEach(property => {
      if (geolocationPropNames.includes(property) && entity.metadata[property]) {
        const { label } = geolocationProps.find(p => p.name === property);
        entity.metadata[property]
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

const getInheritedMarkers = (template, entity, templates, color) => {
  const markers = [];

  const inheritedGeolocationProps = template.properties.filter(property => {
    if (property.type === 'relationship' && property.inheritProperty) {
      const contentTemplate = templates.find(
        t => t.get('_id').toString() === property.content.toString()
      );
      const inheritedProperty = contentTemplate
        .get('properties')
        .find(p => p.get('_id').toString() === property.inheritProperty.toString());
      return inheritedProperty.get('type') === 'geolocation';
    }

    return false;
  });

  const inheritedGeolocationPropNames = inheritedGeolocationProps.map(p => p.name);

  if (inheritedGeolocationProps.length && entity.metadata) {
    Object.keys(entity.metadata).forEach(property => {
      if (inheritedGeolocationPropNames.includes(property) && entity.metadata[property]) {
        const { label, content: context } = inheritedGeolocationProps.find(
          p => p.name === property
        );
        entity.metadata[property].forEach(relatedProperty => {
          if (relatedProperty.inherit_geolocation) {
            // conditional is a quick hack to prevent app crash
            relatedProperty.inherit_geolocation
              .filter(mo => mo.value)
              .forEach(({ value: point }) => {
                const { lat, lon } = point;
                const properties = {
                  entity,
                  color,
                  info: point.label,
                  inherited: true,
                  inheritedEntity: relatedProperty.value,
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
  const color = templates.indexOf(template);
  const templateJS = template.toJS();
  const entityJS = entity.toJS();

  const propertyBasedMarkers = getPropertyBasedMarkers(templateJS, entityJS, color);
  const inheritedMarkers = getInheritedMarkers(templateJS, entityJS, templates, color);

  return [].concat(propertyBasedMarkers, inheritedMarkers);
};

const getMarkers = (entities, templates) => {
  let markers = [];
  entities.forEach(entity => {
    const entityMarkers = getEntityMarkers(entity, templates); //).toJS().filter(m => m);
    markers = markers.concat(entityMarkers);
  });

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
