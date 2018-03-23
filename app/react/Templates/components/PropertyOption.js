import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { DragSource } from 'react-dnd';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { removeProperty } from 'app/Templates/actions/templateActions';
import Icons from './Icons';

export class PropertyOption extends Component {
  render() {
    const { connectDragSource } = this.props;
    const { label } = this.props;
    const iconClass = Icons[this.props.type] || 'fa fa-font';
    const liClass = `list-group-item${this.props.disabled ? ' disabled' : ''}`;
    return (
      connectDragSource(
        <li className={liClass}>
          <span>
            <i className="fa fa-clone" />
            <i className={iconClass} />&nbsp;{label}
          </span>
        </li>
      )
    );
  }
}

PropertyOption.propTypes = {
  connectDragSource: PropTypes.func.isRequired,
  label: PropTypes.string.isRequired,
  type: PropTypes.string.isRequired,
  disabled: PropTypes.bool
};

const optionSource = {
  beginDrag(props) {
    return Object.assign({}, props);
  },

  canDrag(props) {
    return !props.disabled;
  },

  endDrag(props, monitor) {
    const item = monitor.getItem();
    const dropResult = monitor.getDropResult();
    if (!dropResult && item.index) {
      props.removeProperty(item.index);
    }
  }
};

const dragSource = DragSource('METADATA_OPTION', optionSource, connector => ({
  connectDragSource: connector.dragSource()
}))(PropertyOption);

export { dragSource };

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ removeProperty }, dispatch);
}

export default connect(null, mapDispatchToProps, null, { withRef: true })(dragSource);
