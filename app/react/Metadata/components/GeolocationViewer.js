import React from 'react';
import PropTypes from 'prop-types';
import formatcoords from 'formatcoords';

import { Map } from 'app/Map';

const GeolocationViewer = ({ points, onlyForCards }) => {
  if (onlyForCards) {
    return (
      <div>
        {points
          .filter(p => Boolean(p))
          .map((p, i) => {
            const coords = formatcoords(p.lat, p.lon);
            return (
              <div key={i}>
                {p.label ? `${p.label}: ` : ''}
                {coords.format('DD MM ss X', { latLonSeparator: ', ', decimalPlaces: 0 })}
              </div>
            );
          })}
      </div>
    );
  }

  const markers = [];
  points
    .filter(p => Boolean(p))
    .forEach(({ lat, lon, label }) => {
      markers.push({ latitude: lat, longitude: lon, properties: { info: label } });
    });

  const componentProps = markers.length
    ? { latitude: markers[0].latitude, longitude: markers[0].longitude }
    : {};

  return <Map {...componentProps} height={370} markers={markers} />;
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
