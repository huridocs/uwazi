import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import PropTypes from 'prop-types';
import Immutable from 'immutable';

import { Map, Markers } from 'app/Map';
import { TemplateLabel } from 'app/Layout';
import {
  getAndSelectDocument,
  selectDocuments,
  unselectAllDocuments,
} from 'app/Library/actions/libraryActions';
import { wrapDispatch } from 'app/Multireducer';

import { Loader } from 'app/components/Elements/Loader';
import markdownDatasets from '../markdownDatasets';

const renderInfo = marker => (
  <div>
    <TemplateLabel template={marker.properties.entity.template} />
    &nbsp; {marker.properties.entity.title}
  </div>
);

export const MapComponent = props => {
  const { data, classname, scrollZoom, showControls, zoom = 6 } = props;
  const clickOnMarker = marker => props.getAndSelectDocument(marker.properties.entity.sharedId);
  const clickOnCluster = cluster => {
    props.unselectAllDocuments();
    props.selectDocuments(cluster.map(m => m.properties.entity));
  };
  return (
    <div className={`Map ${classname}`}>
      {data ? (
        <Markers entities={data}>
          {markers => (
            <Map
              markers={markers}
              zoom={parseInt(zoom, 10)}
              clickOnMarker={clickOnMarker}
              clickOnCluster={clickOnCluster}
              renderPopupInfo={renderInfo}
              cluster
              scrollZoom={scrollZoom === 'true'}
              showControls={showControls === 'true'}
            />
          )}
        </Markers>
      ) : (
        <Loader />
      )}
    </div>
  );
};

MapComponent.defaultProps = {
  classname: '',
  data: null,
  scrollZoom: null,
  showControls: null,
};

MapComponent.propTypes = {
  classname: PropTypes.string,
  data: PropTypes.instanceOf(Immutable.List),
  scrollZoom: PropTypes.string,
  zoom: PropTypes.number,
  showControls: PropTypes.string,
  getAndSelectDocument: PropTypes.func.isRequired,
  selectDocuments: PropTypes.func.isRequired,
  unselectAllDocuments: PropTypes.func.isRequired,
};

export const mapStateToProps = (state, props) => ({
  data: markdownDatasets.getRows(state, props),
});

export const mapDispatchToProps = dispatch =>
  bindActionCreators(
    { getAndSelectDocument, selectDocuments, unselectAllDocuments },
    wrapDispatch(dispatch, 'library')
  );

export default connect(mapStateToProps, mapDispatchToProps, null)(MapComponent);
