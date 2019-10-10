import PropTypes from 'prop-types';
import React, { Component } from 'react';
import Map from 'app/Map/Map';
import { Translate } from 'app/I18N';

const defaultValue = { lat: '', lon: '', label: '' };

function isCoordinateValid(coord) {
  return typeof coord === 'number' && !Number.isNaN(coord);
}

export default class Geolocation extends Component {
  constructor(props) {
    super(props);
    this.latChange = this.latChange.bind(this);
    this.lonChange = this.lonChange.bind(this);
    this.mapClick = this.mapClick.bind(this);
    this.clearCoordinates = this.clearCoordinates.bind(this);

    const { value: [value] } = this.props;

    this.state = {
      currentLatitude: value ? value.lat : '',
      currentLongitude: value ? value.lon : '',
    };
  }

  onChange(newValue) {
    const { onChange, value } = this.props;
    if (!isCoordinateValid(newValue.lat) && !isCoordinateValid(newValue.lon)) {
      onChange();
      return;
    }
    const valueToSend = value.slice(1);
    valueToSend.unshift(newValue);

    onChange(valueToSend);
  }

  getInputValues() {
    const { value } = this.props;
    const { lat, lon, label } = value && value[0] ? value[0] : { ...defaultValue };
    return { lat, lon, label };
  }

  latChange(e) {
    if (!e.target.value) {
      this.setState({ currentLatitude: e.target.value });
      return;
    }

    let latitude = parseFloat(e.target.value);

    latitude = latitude < -90 ? -90 : latitude;
    latitude = latitude > 90 ? 90 : latitude;

    this.setState({ currentLatitude: latitude });

    const { lon, label } = this.getInputValues();
    this.onChange({ lat: parseFloat(latitude), lon, label });
  }

  lonChange(e) {
    this.setState({ currentLongitude: e.target.value });
    if (!e.target.value) {
      return;
    }

    const { lat, label } = this.getInputValues();
    this.onChange({ lat, lon: parseFloat(e.target.value), label });
  }

  mapClick(event) {
    const { label } = this.getInputValues();
    this.onChange({ lat: parseFloat(event.lngLat[1]), lon: parseFloat(event.lngLat[0]), label });
  }

  clearCoordinates() {
    const { onChange } = this.props;
    onChange();
  }

  render() {
    const markers = [];
    const { value: [value] } = this.props;
    const latitude = value ? value.lat : '';
    const longitude = value ? value.lon : '';

    const { currentLatitude, currentLongitude } = this.state;

    if (isCoordinateValid(latitude) && isCoordinateValid(longitude)) {
      markers.push({ latitude: parseFloat(latitude), longitude: parseFloat(longitude) });
    }

    return (
      <div className="geolocation form-inline">
        <Map markers={markers} onClick={this.mapClick} height={370} autoCenter={false} />
        <div className="form-row">
          <div className="form-group half-width">
            <label>Latitude</label>
            <input
              onChange={this.latChange}
              className="form-control"
              type="number"
              id="lat"
              value={currentLatitude}
              step="any"
            />
          </div>
          <div className="form-group half-width">
            <label>Longitude</label>
            <input
              onChange={this.lonChange}
              className="form-control"
              type="number"
              id="lon"
              value={currentLongitude}
              step="any"
            />
          </div>
        </div>
        {(isCoordinateValid(latitude) || isCoordinateValid(longitude)) && (
          <div className="clear-field-button">
            <button type="button" onClick={this.clearCoordinates}>
              <Translate>Clear coordinates</Translate>
            </button>
          </div>
        )}
      </div>
    );
  }
}

Geolocation.defaultProps = {
  value: [{ ...defaultValue }],
};

Geolocation.propTypes = {
  value: PropTypes.arrayOf(PropTypes.object),
  onChange: PropTypes.func.isRequired
};
