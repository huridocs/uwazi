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

export { getMarkersBoudingBox, markersToStyleFormat, TRANSITION_PROPS };
