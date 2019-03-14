import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Immutable from 'immutable';

function getEntityMarkers(entity, templates) {
  const template = templates.find(_t => _t.get('_id') === entity.get('template'));
  const color = templates.indexOf(template);
  const geolocationProps = template.toJS().properties.filter(p => p.type === 'geolocation').map(p => p.name);

  if (geolocationProps) {
    const entityData = entity.toJS();
    const markers = Object.keys(entityData.metadata).reduce((validMarkers, property) => {
      if (geolocationProps.includes(property)) {
        const { lat, lon } = entityData.metadata[property];
        validMarkers.push({ properties: { entity: entityData, color }, latitude: lat, longitude: lon });
      }
      return validMarkers;
    }, []);
    return markers;
  }

  return [];
}

function getMarkers(entities, templates) {
  let markers = [];
  entities.forEach((entity) => {
    const entityMarkers = getEntityMarkers(entity, templates); //).toJS().filter(m => m);
    markers = markers.concat(entityMarkers);
  });

  return markers;
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
