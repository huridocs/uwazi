import PropTypes from 'prop-types';
import React, { Component } from 'react';
import ReactMapGL, { Marker, Popup } from 'react-map-gl';
import Immutable from 'immutable';
import style from './style.json';

class Map extends Component {
  constructor(props) {
    super(props);
    this.state = {
      viewport: {
        latitude: props.latitude || 46,
        longitude: props.longitude || 6,
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
    this.onHover = this.onHover.bind(this);
  }

  componentDidMount() {
    this.setSize();
    const map = this.map.getMap();
    map.on('style.load', () => {
      this.centerOnMarkers(this.props.markers);
    });
    map.on('moveend', (e) => {
      if (e.autoCentered) {
        this.setViweport(map);
      }
    });
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
    console.log(e.features[0]);
    const feature = e.features.find(f => f.layer.id === 'unclustered-point');
    if (feature) {
      this.clickOnMarker(this.props.markers[feature.properties.index]);
    }
    this.props.onClick(e);
  }

  onHover(e) {
    const feature = e.features.find(f => f.layer.id === 'unclustered-point');
    if (feature) {
      this.hoverOnMarker(this.props.markers[feature.properties.index]);
    }
    if (!feature) {
      this.setState({ selectedMarker: null });
    }
    this.props.onClick(e);
  }

  setSize() {
    const { viewport } = this.state;
    viewport.width = this.props.width || this.container.offsetWidth;
    viewport.height = this.props.height || this.container.offsetHeight;
    this.setState({ viewport });
  }

  setViweport(map) {
    const viewport = Object.assign(this.state.viewport, {
      latitude: map.getCenter().lat,
      longitude: map.getCenter().lng,
      zoom: map.getZoom(),
      pitch: map.getPitch(),
      bearing: map.getBearing()
    });
    this.setState({ viewport });
  }

  centerOnMarkers(markers) {
    if (!this.map || !markers.length || !this.props.autoCenter) {
      return;
    }
    const map = this.map.getMap();
    const boundaries = markers.reduce((b, marker) => {
      if (!b[0][0] || marker.longitude < b[0][0]) {
        b[0][0] = marker.longitude;
      }
      if (!b[1][0] || marker.longitude > b[1][0]) {
        b[1][0] = marker.longitude;
      }
      if (!b[1][1] || marker.latitude > b[1][1]) {
        b[1][1] = marker.latitude;
      }
      if (!b[0][1] || marker.latitude < b[0][1]) {
        b[0][1] = marker.latitude;
      }
      return b;
    }, [[null, null], [null, null]]);
    map.fitBounds(boundaries, { padding: 20 }, { autoCentered: true });
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
    const currentData = this.mapStyle.getIn(['sources', 'markers', 'data', 'features']);
    if (currentData.equals(Immutable.fromJS(markersData))) {
      return;
    }
    this.centerOnMarkers(props.markers);
    this.mapStyle = this.mapStyle.setIn(['sources', 'markers', 'data', 'features'], Immutable.fromJS(markersData));
  }

  clickOnMarker(marker) {
    this.props.clickOnMarker(marker);
  }

  hoverOnMarker(marker) {
    this.setState({ selectedMarker: marker });
    this.props.hoverOnMarker(marker);
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
    return selectedMarker && selectedMarker.properties && selectedMarker.properties.info &&
      <Popup
        tipSize={6}
        anchor="bottom"
        longitude={selectedMarker.longitude}
        latitude={selectedMarker.latitude}
        onClose={() => this.setState({ selectedMarker: null })}
      >
        <div>
          {selectedMarker.properties.info}
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

  render() {
    const viewport = Object.assign({}, this.state.viewport);
    return (
      <div className="map-container" ref={(container) => { this.container = container; }} style={{ width: '100%', height: '100%' }}>
        <ReactMapGL
          ref={ref => this.map = ref}
          {...viewport}
          dragRotate
          mapStyle={this.mapStyle}
          onViewportChange={this._onViewportChange}
          onClick={this.onClick}
          onHover={this.onHover}
        >
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
  hoverOnMarker: () => {},
  clickOnCluster: () => {},
  renderMarker: null,
  cluster: false,
  autoCenter: false
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
  clickOnCluster: PropTypes.func,
  hoverOnMarker: PropTypes.func,
  renderMarker: PropTypes.func,
  cluster: PropTypes.bool,
  autoCenter: PropTypes.bool
};

export default Map;
