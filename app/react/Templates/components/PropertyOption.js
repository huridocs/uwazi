import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { DragSource } from 'react-dnd';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Icon } from 'UI';
import { Translate } from 'app/I18N';
import { removeProperty, addProperty } from 'app/Templates/actions/templateActions';
import Icons from './Icons';

class PropertyOption extends Component {
  constructor(props) {
    super(props);
    this.addProperty = this.addProperty.bind(this);
  }

  addProperty() {
    const { disabled, label, type, addProperty: addPropertyAction } = this.props;
    if (!disabled) {
      addPropertyAction({ label, type });
    }
  }

  render() {
    const { connectDragSource, label, disabled, type } = this.props;
    const iconClass = Icons[type] || 'font';
    const liClass = `list-group-item${disabled ? ' disabled' : ''}`;
    return connectDragSource(
      <li className={liClass}>
        <button type="button" onClick={this.addProperty}>
          <Icon icon="plus" />
        </button>
        <span>
          <Icon icon={iconClass} />
          &nbsp;
          <Translate translationKey={type}>{label}</Translate>
        </span>
      </li>
    );
  }
}

PropertyOption.propTypes = {
  connectDragSource: PropTypes.func.isRequired,
  addProperty: PropTypes.func.isRequired,
  label: PropTypes.string.isRequired,
  type: PropTypes.string.isRequired,
  disabled: PropTypes.bool,
};

const optionSource = {
  beginDrag({ ...props }) {
    return props;
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
  },
};

const dragSource = DragSource('METADATA_OPTION', optionSource, connector => ({
  connectDragSource: connector.dragSource(),
}))(PropertyOption);

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ removeProperty, addProperty }, dispatch);
}

export { dragSource };
export { PropertyOption };
export default connect(null, mapDispatchToProps, null, { withRef: true })(dragSource);
