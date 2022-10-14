import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Immutable from 'immutable';
import { Map, Markers } from 'app/Map';
import { bindActionCreators } from 'redux';
import { wrapDispatch } from 'app/Multireducer';
import {
  getAndSelectDocument,
  selectDocuments,
  unselectAllDocuments,
} from 'app/Library/actions/libraryActions';
import { SearchBar } from 'app/Library/components/SearchBar';
import { t } from 'app/I18N';

class MapViewComponent extends Component {
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
    const { storeKey, markers } = this.props;
    return (
      <div className="library-map main-wrapper" style={{ width: '100%', height: '100%' }}>
        <div className="search-list">
          <SearchBar storeKey={storeKey} />
        </div>
        <div className="documents-counter">
          <span>
            <b>{markers.get('totalRows')}</b> {t('System', 'documents')}
          </span>
        </div>
        <Markers entities={markers.get('rows')}>
          {processedMarkers => (
            <Map
              ref={ref => {
                // eslint-disable-next-line react/no-unused-class-component-methods
                this.map = ref;
              }}
              markers={processedMarkers}
              clickOnMarker={this.clickOnMarker}
              clickOnCluster={this.clickOnCluster}
              renderPopupInfo
              cluster
            />
          )}
        </Markers>
      </div>
    );
  }
}

MapViewComponent.propTypes = {
  markers: PropTypes.instanceOf(Immutable.Map).isRequired,
  storeKey: PropTypes.string.isRequired,
  getAndSelectDocument: PropTypes.func.isRequired,
  selectDocuments: PropTypes.func.isRequired,
  unselectAllDocuments: PropTypes.func.isRequired,
};

function mapStateToProps(state, props) {
  return {
    markers: state[props.storeKey].markers,
  };
}

function mapDispatchToProps(dispatch, props) {
  return bindActionCreators(
    { getAndSelectDocument, selectDocuments, unselectAllDocuments },
    wrapDispatch(dispatch, props.storeKey)
  );
}

const MapView = connect(mapStateToProps, mapDispatchToProps, null, { withRef: true })(
  MapViewComponent
);

export { MapViewComponent, MapView };
