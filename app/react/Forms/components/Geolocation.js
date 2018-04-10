import PropTypes from 'prop-types';
import React, { Component } from 'react';

export default class Geolocation extends Component {
  constructor(props) {
    super(props);
    this.latChange = this.latChange.bind(this);
    this.lonChange = this.lonChange.bind(this);
  }

  onChange(value) {
    this.props.onChange(value);
  }

  latChange(e) {
    const lat = e.target.value;
    this.onChange({ lat, lon: this.props.value.lon });
  }

  lonChange(e) {
    const lon = e.target.value;
    this.onChange({ lat: this.props.value.lat, lon });
  }

  render() {
    return (
      <div className="geolocation form-inline">
        <div className="form-group">
          <label htmlFor="lat">
            <span>Latitude:</span>&nbsp;
            <input onChange={this.latChange} className="form-control" type="number" id="lat" value={this.props.value.lat}/>
          </label>
          <label htmlFor="lon">
            <span>Longitude:</span>&nbsp;
            <input onChange={this.lonChange} className="form-control" type="number" id="lon" value={this.props.value.lon}/>
          </label>
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
