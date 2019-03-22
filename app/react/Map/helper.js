const getMarkersBoudingBox = markers => markers.reduce((_b, marker) => {
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
}, [[null, null], [null, null]]);

const markersToStyleFormat = markers => markers.map((marker, index) => {
  const properties = marker.properties || {};
  const { longitude, latitude } = marker;
  properties.index = index;
  return {
          type: 'Feature',
          properties,
          geometry: {
            type: 'Point',
            coordinates: [longitude, latitude]
          }
  };
});

const noop = () => {};

function getEntityMarkers(entity, templates) {
  const template = templates.find(_t => _t.get('_id') === entity.get('template'));
  const color = templates.indexOf(template);
  const geolocationProps = template.toJS().properties.filter(p => p.type === 'geolocation');
  const geolocationPropNames = geolocationProps.map(p => p.name);

  if (geolocationProps) {
    const entityData = entity.toJS();
    const markers = (entityData.metadata ? Object.keys(entityData.metadata) : []).reduce((validMarkers, property) => {
      if (geolocationPropNames.includes(property) && entityData.metadata[property]) {
        const { label } = geolocationProps.find(p => p.name === property);
        entityData.metadata[property].forEach((point) => {
          const { lat, lon } = point;
          validMarkers.push({ properties: { entity: entityData, color, info: point.label }, latitude: lat, longitude: lon, label });
        });
      }
      return validMarkers;
    }, []);
    return markers;
  }

  return [];
}

const getMarkers = (entities, templates) => {
  let markers = [];
  entities.forEach((entity) => {
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
  onStateChange: noop
};

export {
  getMarkersBoudingBox,
  markersToStyleFormat,
  getMarkers,
  TRANSITION_PROPS,
};
