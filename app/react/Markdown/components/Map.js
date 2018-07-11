import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Immutable from 'immutable';

import Map from 'app/Map/Map';
import { TemplateLabel } from 'app/Layout';

import Loader from 'app/components/Elements/Loader';
import markdownDatasets from '../markdownDatasets';

function getMarker(entity, templates) {
  const template = templates.find(_t => _t.get('_id') === entity.get('template'));
  const color = templates.indexOf(template);
  const geolocationProp = template.toJS().properties.find(p => p.type === 'geolocation');
  if (geolocationProp) {
    const _entity = entity.toJS();
    const marker = _entity.metadata[geolocationProp.name];
    return marker ? { properties: { entity: _entity, color }, latitude: marker.lat, longitude: marker.lon } : null;
  }

  return null;
}

function getMarkers(data, templates) {
  return data.map(entity => getMarker(entity, templates)).toJS().filter(m => m);
}

function renderInfo(marker) {
  return (
    <div>
      <TemplateLabel template={marker.properties.entity.template} />
      &nbsp;
      {marker.properties.entity.title}
    </div>
  );
}

export const MapComponent = (props) => {
  const { data, templates, classname } = props;
  let output = <Loader/>;

  if (data) {
    output = (
      <Map
        markers={getMarkers(data, templates)}
        zoom={1}
        clickOnMarker={() => {}}
        clickOnCluster={() => {}}
        renderPopupInfo={renderInfo}
        cluster
      />
    );
  }

  return <div className={`Map ${classname}`}>{output}</div>;
};

MapComponent.defaultProps = {
  classname: '',
  data: null,
};

MapComponent.propTypes = {
  templates: PropTypes.instanceOf(Immutable.List).isRequired,
  classname: PropTypes.string,
  data: PropTypes.instanceOf(Immutable.List),
};

export const mapStateToProps = (state, props) => ({
    data: markdownDatasets.getRows(state, props),
    templates: state.templates,
});

export default connect(mapStateToProps)(MapComponent);
