import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Immutable from 'immutable';

import { Map, Markers } from 'app/Map';
import { TemplateLabel } from 'app/Layout';

import Loader from 'app/components/Elements/Loader';
import markdownDatasets from '../markdownDatasets';

const renderInfo = marker => (
  <div>
    <TemplateLabel template={marker.properties.entity.template} />
    &nbsp; {marker.properties.entity.title}
  </div>
);

export const MapComponent = ({ data, classname }) => (
  <div className={`Map ${classname}`}>
    {data ? (
      <Markers entities={data}>
        {markers => (
          <Map
            markers={markers}
            zoom={1}
            clickOnMarker={() => {}}
            clickOnCluster={() => {}}
            renderPopupInfo={renderInfo}
            cluster
          />
        )}
      </Markers>
    ) : <Loader/>}
  </div>
);

MapComponent.defaultProps = {
  classname: '',
  data: null,
};

MapComponent.propTypes = {
  classname: PropTypes.string,
  data: PropTypes.instanceOf(Immutable.List),
};

export const mapStateToProps = (state, props) => ({
  data: markdownDatasets.getRows(state, props),
});

export default connect(mapStateToProps)(MapComponent);
