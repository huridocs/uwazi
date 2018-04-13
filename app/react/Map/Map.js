import PropTypes from 'prop-types';
import React, { Component } from 'react';
import ReactMapGL, { NavigationControl, Marker, Popup } from 'react-map-gl';
import './styles.scss';

class Map extends Component {
  static markerClassName(marker) {
    if (marker.size > 20) {
      return 'map-marker-high';
    }

    if (marker.size > 10) {
      return 'map-marker-medium';
    }

    return 'map-marker-low';
  }

  constructor(props) {
    super(props);
    this.state = {
      viewport: {
        latitude: props.latitude,
        longitude: props.longitude,
        width: props.width,
        height: props.height,
        zoom: props.zoom,
      },
      popupInfo: null
    };

    this._onViewportChange = (viewport) => {
      this.setState({ viewport });
    };

    this._onClick = (event) => {
      this.props.onClick(event);
    };
    this.setSize = this.setSize.bind(this);
  }

  componentDidMount() {
    this.setSize();
    this.eventListener = window.addEventListener('resize', this.setSize);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.setSize);
  }

  setSize() {
    if (!this.container) {
      return;
    }
    const width = this.container.offsetWidth;
    const height = width * 0.6;
    const { viewport } = this.state;
    viewport.width = width;
    viewport.height = height;
    this.setState({ viewport });
  }

  renderPopup() {
    const { popupInfo } = this.state;

    return this.state.popupInfo &&
      <Popup
        tipSize={6}
        anchor="bottom"
        longitude={popupInfo.longitude}
        latitude={popupInfo.latitude}
        onClose={() => this.setState({ popupInfo: null })}
      >
        <div>
          {popupInfo.size}
        </div>
      </Popup>;
  }

  renderMarker(marker) {
    return (
      <i
        style={{ position: 'relative', top: '-14px', right: '13px', color: '#60748b' }}
        className={`fa fa-map-marker fa-lg fa-fw map-marker ${Map.markerClassName(marker)}`}
        onClick={() => this.setState({ popupInfo: marker })}
      />
    );
  }

  renderMarkers() {
    const { markers } = this.props;
    return markers.map((marker, index) =>
      (
        <Marker {...marker} key={index} offsetLeft={0} offsetTop={0} >
          {this.renderMarker(marker)}
        </Marker>
      )
    );
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
      <div ref={(container) => { this.container = container; }} style={{ width: '100%', height: '100%' }}>
        <ReactMapGL
          {...viewport}
          dragRotate
          mapStyle="https://openmaptiles.github.io/klokantech-basic-gl-style/style-cdn.json"
          onViewportChange={this._onViewportChange}
          onClick={this._onClick}
        >
          <div style={{ position: 'absolute', left: 5, top: 5 }}>
            <NavigationControl onViewportChange={this._onViewportChange}/>
          </div>
          {this.renderMarkers()}
          {this.renderPopup()}
        </ReactMapGL>
      </div>
    );
  }
}

Map.defaultProps = {
  markers: [],
  latitude: 50,
  longitude: 50,
  zoom: 7,
  width: 250,
  height: 200,
  onClick: () => {}
};

Map.propTypes = {
  markers: PropTypes.arrayOf(PropTypes.object),
  latitude: PropTypes.number,
  longitude: PropTypes.number,
  zoom: PropTypes.number,
  width: PropTypes.number,
  height: PropTypes.number,
  onClick: PropTypes.func
};

export default Map;
