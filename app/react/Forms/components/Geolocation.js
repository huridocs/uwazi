import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Map } from 'app/Map';
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
    this.emptyValue = [];
    const { lat, lon } = this.getInputValues();

    this.state = {
      currentLatitude: lat,
      currentLongitude: lon,
    };
  }

  onChange(newValue) {
    this.setState({ currentLatitude: newValue.lat, currentLongitude: newValue.lon });
    const { onChange, value } = this.props;

    if (!newValue.lat && !newValue.lon) {
      onChange(this.emptyValue);
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
    let latitude = e.target.value ? parseFloat(e.target.value) : '';
    latitude = latitude && latitude < -89.99999 ? -89.99999 : latitude;
    latitude = latitude && latitude > 90 ? 90 : latitude;

    const { label } = this.getInputValues();
    const { currentLongitude } = this.state;
    this.onChange({ lat: latitude, lon: currentLongitude, label });
  }

  lonChange(e) {
    const longitude = e.target.value ? parseFloat(e.target.value) : '';

    const { label } = this.getInputValues();
    const { currentLatitude } = this.state;
    this.onChange({ lat: currentLatitude, lon: longitude, label });
  }

  mapClick(event) {
    const { label } = this.getInputValues();
    this.onChange({ lat: parseFloat(event.lngLat[1]), lon: parseFloat(event.lngLat[0]), label });
  }

  clearCoordinates() {
    this.setState({ currentLatitude: '', currentLongitude: '' });
    const { onChange } = this.props;
    onChange(this.emptyValue);
  }

  render() {
    const { currentLatitude, currentLongitude } = this.state;
    const markers = [];

    if (isCoordinateValid(currentLatitude) && isCoordinateValid(currentLongitude)) {
      markers.push({
        latitude: parseFloat(currentLatitude),
        longitude: parseFloat(currentLongitude),
      });
    }

    return (
      <div className="geolocation form-inline">
        <Map
          markers={markers}
          onClick={this.mapClick}
          height={370}
          autoCenter={false}
          mapStyleSwitcher
          showControls
        />
        <div className="form-row">
          <div className="form-group half-width">
            <label>
              <Translate>Latitude</Translate>
            </label>
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
            <label>
              <Translate>Longitude</Translate>
            </label>
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
        {(currentLatitude || currentLongitude) && (
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
  onChange: PropTypes.func.isRequired,
};
