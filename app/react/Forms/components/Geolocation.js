import PropTypes from 'prop-types';
import React, { Component } from 'react';
import Map from 'app/Map/Map';
import { Translate } from 'app/I18N';

function isCoordValid(coord) {
  // eslint-disable-next-line no-restricted-globals
  return typeof coord === 'number' && !isNaN(coord);
}

export default class Geolocation extends Component {
  constructor(props) {
    super(props);

    this.latChange = this.latChange.bind(this);
    this.lonChange = this.lonChange.bind(this);
    this.mapClick = this.mapClick.bind(this);
    this.clearCoordinates = this.clearCoordinates.bind(this);
  }

  onChange(newValue) {
    const { onChange, value } = this.props;
    if (!isCoordValid(newValue.lat) && !isCoordValid(newValue.lon)) {
      onChange();
      return;
    }
    const valueToSend = value.slice(1);
    valueToSend.unshift(newValue);

    onChange(valueToSend);
  }

  getInputValues() {
    const { value } = this.props;
    const { lat, lon, label } = value[0];
    return { lat, lon, label };
  }

  latChange(e) {
    const { lon, label } = this.getInputValues();
    this.onChange({ lat: parseFloat(e.target.value), lon, label });
  }

  lonChange(e) {
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

    let lat;
    let lon;

    if (value) {
      ({ lat, lon } = value);
    }

    if (isCoordValid(lat) && isCoordValid(lon)) {
      markers.push({ latitude: parseFloat(value.lat), longitude: parseFloat(value.lon) });
    }

    return (
      <div className="geolocation form-inline">
        <Map markers={markers} onClick={this.mapClick} height={370} autoCenter={false}/>
        <div className="form-row">
          <div className="form-group half-width">
            <label>Latitude</label>
            <input onChange={this.latChange} className="form-control" type="number" id="lat" value={lat} step="any"/>
          </div>
          <div className="form-group half-width">
            <label>Longitude</label>
            <input onChange={this.lonChange} className="form-control" type="number" id="lon" value={lon} step="any"/>
          </div>
        </div>
        { (isCoordValid(lat) || isCoordValid(lon)) && (
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
  value: [{ lat: '', lon: '', label: '' }],
};

Geolocation.propTypes = {
  value: PropTypes.arrayOf(PropTypes.object),
  onChange: PropTypes.func.isRequired
};
