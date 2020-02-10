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
import SearchBar from 'app/Library/components/SearchBar';
import { TemplateLabel, EntityTitle } from 'app/Layout';
import { t } from 'app/I18N';
import { Icon } from 'app/UI';

const markerInfo = info => (
  <div className="marker-info">
    <Icon className="tag-icon" icon="tag" />
    {info}
  </div>
);

export class MapView extends Component {
  static renderInfo(marker) {
    return (
      <div className="popup-container">
        <div className="template-label">
          <TemplateLabel template={marker.properties.entity.template} />
        </div>
        <div className="entity-data">
          <div>
            <span className="popup-name">{marker.properties.entity.title}</span>
            <span className="popup-metadata-property">
              ({t(marker.properties.entity.template, marker.label)})
            </span>
          </div>
          {marker.properties.inherited &&
            markerInfo(
              <EntityTitle
                context={marker.properties.context}
                entity={marker.properties.inheritedEntity}
              />
            )}
          {marker.properties.info &&
            !marker.properties.inherited &&
            markerInfo(marker.properties.info)}
        </div>
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
                this.map = ref;
              }}
              markers={processedMarkers}
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
  unselectAllDocuments: PropTypes.func.isRequired,
};

export function mapStateToProps(state, props) {
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

export default connect(mapStateToProps, mapDispatchToProps, null, { withRef: true })(MapView);
