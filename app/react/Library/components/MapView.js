import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Immutable from 'immutable';
import Map from 'app/Map/Map';
import { bindActionCreators } from 'redux';
import { wrapDispatch } from 'app/Multireducer';
import { selectDocument, unselectAllDocuments } from 'app/Library/actions/libraryActions';

export class MapView extends Component {
  static renderMarker(marker, onClick) {
    return (
      <i
        style={{ position: 'relative', top: '-35px', right: '25px' }}
        className={`fa fa-map-marker fa-3x fa-fw map-marker color-${marker.templateIndex}`}
        onClick={onClick}
      />
    );
  }

  constructor(props) {
    super(props);
    this.clickOnMarker = this.clickOnMarker.bind(this);
  }

  getMarker(entity) {
    const template = this.props.templates.find(t => t.get('_id') === entity.get('template'));
    const templateIndex = this.props.templates.indexOf(template);
    const geolocationProp = template.toJS().properties.find(p => p.type === 'geolocation');
    if (geolocationProp) {
      const _entity = entity.toJS();
      const marker = _entity.metadata[geolocationProp.name];
      return marker ? { entity, latitude: marker.lat, longitude: marker.lon, templateIndex } : null;
    }

    return null;
  }

  getMarkers() {
    return this.props.entities.get('rows').map(entity => this.getMarker(entity)).toJS().filter(m => m);
  }

  clickOnMarker(marker) {
    this.props.unselectAllDocuments();
    this.props.selectDocument(marker.entity);
  }

  render() {
    const markers = this.getMarkers();
    return (
      <Map markers={markers} zoom={1} clickOnMarker={this.clickOnMarker} renderMarker={MapView.renderMarker}/>
    );
  }
}

MapView.propTypes = {
  entities: PropTypes.instanceOf(Immutable.Map).isRequired,
  templates: PropTypes.instanceOf(Immutable.List).isRequired,
  selectDocument: PropTypes.func.isRequired,
  unselectAllDocuments: PropTypes.func.isRequired
};

export function mapStateToProps(state, props) {
  return {
    entities: state[props.storeKey].markers,
    templates: state.templates
  };
}

function mapDispatchToProps(dispatch, props) {
  return bindActionCreators({ selectDocument, unselectAllDocuments }, wrapDispatch(dispatch, props.storeKey));
}

export default connect(mapStateToProps, mapDispatchToProps)(MapView);
