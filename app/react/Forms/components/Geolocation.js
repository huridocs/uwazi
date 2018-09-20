import PropTypes from 'prop-types';
import React, { Component } from 'react';
import Map from 'app/Map/Map';

export default class Geolocation extends Component {
  constructor(props) {
    super(props);
    this.latChange = this.latChange.bind(this);
    this.lonChange = this.lonChange.bind(this);
    this.mapClick = this.mapClick.bind(this);
  }

  onChange(value) {
    this.props.onChange(value);
  }

  latChange(e) {
    const lat = parseFloat(e.target.value);
    this.onChange({ lat, lon: this.props.value.lon });
  }

  lonChange(e) {
    const lon = parseFloat(e.target.value);
    this.onChange({ lat: this.props.value.lat, lon });
  }

  mapClick(event) {
    this.onChange({ lat: parseFloat(event.lngLat[1]), lon: parseFloat(event.lngLat[0]) });
  }

  render() {
    const markers = [];
    const { value } = this.props;
    let lat;
    let lon;

    if (value) {
      lat = value.lat;
      lon = value.lon;
    }

    if (lat && lon) {
      markers.push({ latitude: parseFloat(value.lat), longitude: parseFloat(value.lon) });
    }
    return (
      <div className="geolocation form-inline">
        <Map markers={markers} onClick={this.mapClick} height={370} autoCenter={false}/>
        <div className="form-row">
          <div className="form-group">
            <label>Latitude&nbsp;</label>
            <input onChange={this.latChange} className="form-control" type="number" id="lat" value={lat} step="any"/>
          </div>
          <div className="form-group">
            <label>Longitude&nbsp;</label>
            <input onChange={this.lonChange} className="form-control" type="number" id="lon" value={lon} step="any"/>
          </div>
        </div>
      </div>
    );
  }
}

Geolocation.defaultProps = {
  value: { lat: '', lon: '' }
};

Geolocation.propTypes = {
  value: PropTypes.instanceOf(Object),
  onChange: PropTypes.func.isRequired
};
