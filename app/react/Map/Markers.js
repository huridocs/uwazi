import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Immutable from 'immutable';
import { createSelector } from 'reselect';
import { getMarkers } from './helper';

const selectMarkers = createSelector(
  ({ entities }) => entities,
  ({ state }) => state.templates,
  (entities, templates) => getMarkers(entities, templates)
);

export const MarkersComponent = ({ children, markers }) => children(markers);

MarkersComponent.defaultProps = {
  entities: Immutable.List(),
};

MarkersComponent.propTypes = {
  children: PropTypes.func.isRequired,
  templates: PropTypes.instanceOf(Immutable.List).isRequired,
  entities: PropTypes.instanceOf(Immutable.List),
};

export const mapStateToProps = (state, ownProps) => ({
  markers: selectMarkers({ state, entities: ownProps.entities }),
  templates: state.templates,
});

export default connect(mapStateToProps)(MarkersComponent);
