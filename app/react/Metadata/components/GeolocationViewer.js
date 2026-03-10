import React from 'react';
import PropTypes from 'prop-types';
import formatcoords from 'formatcoords';
import { Translate } from 'app/I18N';

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
    .forEach(({ lat, lon, label, color }) => {
      markers.push({
        latitude: lat,
        longitude: lon,
        properties: { info: label, ...(color ? { color } : {}) },
      });
    });

  const componentProps = markers.length
    ? { latitude: markers[0].latitude, longitude: markers[0].longitude }
    : {};

  return (
    <>
      <Map {...componentProps} height={370} markers={markers} mapStyleSwitcher showControls />
      <div className="print-view-alt">
        <p>
          <Translate>Latitude</Translate>: {componentProps.latitude}
        </p>
        <p>
          <Translate>Longitude</Translate>: {componentProps.longitude}
        </p>
      </div>
    </>
  );
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
