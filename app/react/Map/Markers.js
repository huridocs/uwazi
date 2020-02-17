import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Immutable from 'immutable';

import { getMarkers } from './helper';

export const MarkersComponent = ({ children, entities, templates }) =>
  children(getMarkers(entities, templates));

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
