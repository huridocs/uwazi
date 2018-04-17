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
    if (this.props.value.lat && this.props.value.lon) {
      markers.push({ latitude: this.props.value.lat, longitude: this.props.value.lon });
    }
    return (
      <div className="geolocation form-inline">
        <Map markers={markers} latitude={this.props.value.lat} longitude={this.props.value.lon} onClick={this.mapClick}/>
        <div className="form-row">
          <div className="form-group">
            <label>Latitude:</label>
            <input onChange={this.latChange} className="form-control" type="number" id="lat" value={this.props.value.lat}/>
          </div>
          <div className="form-group">
            <label>Longitude:</label>
            <input onChange={this.lonChange} className="form-control" type="number" id="lon" value={this.props.value.lon}/>
          </div>
        </div>
      </div>
    );
  }
}

Geolocation.propTypes = {
  value: PropTypes.shape({
    lat: PropTypes.number,
    lon: PropTypes.number
  }).isRequired,
  onChange: PropTypes.func.isRequired
};
