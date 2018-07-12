import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Immutable from 'immutable';

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

function getMarkers(entities, templates) {
  return entities.map(entity => getMarker(entity, templates)).toJS().filter(m => m);
}

export const MarkersComponent = ({ children, entities, templates }) => children(getMarkers(entities, templates));

MarkersComponent.defaultProps = {
  entities: Immutable.List(),
};

MarkersComponent.propTypes = {
  children: PropTypes.func.isRequired,
  templates: PropTypes.instanceOf(Immutable.List).isRequired,
  entities: PropTypes.instanceOf(Immutable.List),
};

export const mapStateToProps = ({ templates }) => ({ templates });

export default connect(mapStateToProps)(MarkersComponent);
