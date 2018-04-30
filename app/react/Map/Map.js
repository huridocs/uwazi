import PropTypes from 'prop-types';
import React, { Component } from 'react';
import ReactMapGL, { NavigationControl, Marker, Popup } from 'react-map-gl';
import Immutable from 'immutable';
import style from './style.json';

const defaultLatitude = 46.22093287671913;
const defaultLongitude = 6.139284045121682;

class Map extends Component {
  constructor(props) {
    super(props);
    this.state = {
      viewport: {
        latitude: props.latitude || defaultLatitude,
        longitude: props.longitude || defaultLongitude,
        width: props.width || 250,
        height: props.height || 200,
        zoom: props.zoom,
      },
      selectedMarker: null
    };
    this.mapStyle = Immutable.fromJS(style);
    this.updateDataSource(props);
    this._onViewportChange = (viewport) => {
      this.setState({ viewport });
    };

    this.setSize = this.setSize.bind(this);
    this.onClick = this.onClick.bind(this);
  }

  componentDidMount() {
    this.setSize();
    this.eventListener = window.addEventListener('resize', this.setSize);
  }

  componentWillReceiveProps(props) {
    const { markers } = props;
    const latitude = props.latitude || this.state.viewport.latitude;
    const longitude = props.longitude || this.state.viewport.longitude;
    const viewport = Object.assign(this.state.viewport, { latitude, longitude, markers });
    this.updateDataSource(props);
    this.setState({ viewport });
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.setSize);
  }

  onClick(e) {
    const feature = e.features.find(f => f.layer.id === 'unclustered-point');
    if (feature) {
      this.clickOnMarker(this.props.markers[feature.properties.index]);
    }
    this.props.onClick(e);
  }

  setSize() {
    if (!this.container || this.props.width) {
      return;
    }
    this.container.childNodes[0].style.width = 0;
    let width = this.container.offsetWidth;
    width = width < 240 ? 240 : width;
    this.container.childNodes[0].style.width = width;
    const height = width * 0.6;
    const { viewport } = this.state;
    viewport.width = width;
    viewport.height = height;
    this.setState({ viewport });
  }

  updateDataSource(props) {
    if (!this.props.cluster) {
      return;
    }
    const markersData = props.markers
    .map((marker, index) => {
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
    this.mapStyle = this.mapStyle.setIn(['sources', 'markers', 'data', 'features'], markersData);
  }

  clickOnMarker(marker) {
    this.setState({ selectedMarker: marker });
    this.props.clickOnMarker(marker);
  }

  renderMarker(marker, onClick) {
    if (this.props.renderMarker) {
      return this.props.renderMarker(marker, onClick);
    }
    return (
      <i
        style={{ position: 'relative', top: '-35px', right: '25px', color: '#d9534e' }}
        className="fa fa-map-marker fa-3x fa-fw map-marker"
        onClick={onClick}
      />
    );
  }

  renderPopup() {
    const { selectedMarker } = this.state;
    return selectedMarker && selectedMarker.info &&
      <Popup
        tipSize={6}
        anchor="bottom"
        longitude={selectedMarker.longitude}
        latitude={selectedMarker.latitude}
        onClose={() => this.setState({ selectedMarker: null })}
      >
        <div>
          {selectedMarker.info}
        </div>
      </Popup>;
  }

  renderMarkers() {
    const { markers, cluster } = this.props;
    if (cluster) {
      return false;
    }

    return markers.map((marker, index) => {
      const onClick = this.clickOnMarker.bind(this, marker);
      return (
        <Marker {...marker} key={index} offsetLeft={0} offsetTop={0}>
          {this.renderMarker(marker, onClick)}
        </Marker>
      );
    });
  }

  /*OSM Styles
    https://openmaptiles.github.io/osm-bright-gl-style/style-cdn.json
    https://openmaptiles.github.io/positron-gl-style/style-cdn.json
    https://openmaptiles.github.io/dark-matter-gl-style/style-cdn.json
    https://openmaptiles.github.io/klokantech-basic-gl-style/style-cdn.json
  */

  render() {
    const viewport = Object.assign({}, this.state.viewport);
    return (
      <div className="map-container" ref={(container) => { this.container = container; }} style={{ width: '100%' }}>
        <ReactMapGL
          {...viewport}
          dragRotate
          mapStyle={this.mapStyle}
          onViewportChange={this._onViewportChange}
          onClick={this.onClick}
        >
          <div style={{ position: 'absolute', left: 5, top: 5 }}>
            <NavigationControl onViewportChange={this._onViewportChange}/>
          </div>
          {this.renderMarkers()}
          {this.renderPopup()}

          <i className="mapbox-help fa fa-question-circle">
            <span className="mapbox-tooltip">Hold shift to rotate the map</span>
          </i>
        </ReactMapGL>
      </div>
    );
  }
}

Map.defaultProps = {
  markers: [],
  latitude: null,
  longitude: null,
  zoom: 4,
  width: null,
  height: null,
  onClick: () => {},
  clickOnMarker: () => {},
  renderMarker: null,
  cluster: false
};

Map.propTypes = {
  markers: PropTypes.arrayOf(PropTypes.object),
  latitude: PropTypes.number,
  longitude: PropTypes.number,
  zoom: PropTypes.number,
  width: PropTypes.number,
  height: PropTypes.number,
  onClick: PropTypes.func,
  clickOnMarker: PropTypes.func,
  renderMarker: PropTypes.func,
  cluster: PropTypes.bool
};

export default Map;
