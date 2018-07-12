import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Immutable from 'immutable';
import { Map, Markers } from 'app/Map';
import { bindActionCreators } from 'redux';
import { wrapDispatch } from 'app/Multireducer';
import { getAndSelectDocument, selectDocuments, unselectAllDocuments } from 'app/Library/actions/libraryActions';
import SearchBar from 'app/Library/components/SearchBar';
import { TemplateLabel } from 'app/Layout';
import { t } from 'app/I18N';

export class MapView extends Component {
  static renderInfo(marker) {
    return (
      <div>
        <TemplateLabel template={marker.properties.entity.template} />
        &nbsp;
        {marker.properties.entity.title}
      </div>
    );
  }

  constructor(props) {
    super(props);
    this.clickOnMarker = this.clickOnMarker.bind(this);
    this.clickOnCluster = this.clickOnCluster.bind(this);
  }

  clickOnMarker(marker) {
    this.props.getAndSelectDocument(marker.properties.entity.sharedId);
  }

  clickOnCluster(cluster) {
    this.props.unselectAllDocuments();
    this.props.selectDocuments(cluster.map(m => m.properties.entity));
  }

  render() {
    return (
      <div className="library-map main-wrapper" style={{ width: '100%', height: '100%' }}>
        <div className="search-list"><SearchBar storeKey={this.props.storeKey}/></div>
        <div className="documents-counter">
          <span><b>{this.props.markers.get('totalRows')}</b> {t('System', 'documents')}</span>
        </div>
        <Markers entities={this.props.markers.get('rows')}>
          {markers => (
            <Map
              markers={markers}
              zoom={1}
              clickOnMarker={this.clickOnMarker}
              clickOnCluster={this.clickOnCluster}
              renderPopupInfo={MapView.renderInfo}
              cluster
            />
          )}
        </Markers>
      </div>
    );
  }
}

MapView.propTypes = {
  markers: PropTypes.instanceOf(Immutable.Map).isRequired,
  storeKey: PropTypes.string.isRequired,
  getAndSelectDocument: PropTypes.func.isRequired,
  selectDocuments: PropTypes.func.isRequired,
  unselectAllDocuments: PropTypes.func.isRequired
};

export function mapStateToProps(state, props) {
  return {
    markers: state[props.storeKey].markers,
  };
}

function mapDispatchToProps(dispatch, props) {
  return bindActionCreators({ getAndSelectDocument, selectDocuments, unselectAllDocuments }, wrapDispatch(dispatch, props.storeKey));
}

export default connect(mapStateToProps, mapDispatchToProps)(MapView);
