import React from 'react';
import PropTypes from 'prop-types';
import formatcoords from 'formatcoords';

import { Map } from 'app/Map';

const GeolocationViewer = (props) => {
  const { points, onlyForCards } = props;
  if (onlyForCards) {
    return (
      <div>
        {points.map((p, i) => {
          const coords = formatcoords(p.lat, p.lon);
          return <div key={i}>{p.label ? `${p.label}: ` : ''}{coords.format('DD MM ss X', { latLonSeparator: ', ', decimalPlaces: 0 })}</div>;
        })}
      </div>
    );
  }

  const markers = [];
  points.forEach(({ lat, lon, label }) => {
    markers.push({ latitude: lat, longitude: lon, properties: { info: label } });
  });

  return <Map latitude={points[0].lat} longitude={points[0].lon} height={370} markers={markers}/>;
};

GeolocationViewer.defaultProps = {
  points: [],
  onlyForCards: true,
};

GeolocationViewer.propTypes = {
  points: PropTypes.arrayOf(PropTypes.object),
  onlyForCards: PropTypes.bool,
};

export default GeolocationViewer;
