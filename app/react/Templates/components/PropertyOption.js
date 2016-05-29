import React, {Component, PropTypes} from 'react';
import {DragSource} from 'react-dnd';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';

import {removeProperty} from 'app/Templates/actions/templateActions';

export class PropertyOption extends Component {
  render() {
    const {connectDragSource} = this.props;
    const {label} = this.props;
    let iconClass = 'fa fa-font';

    if (this.props.type === 'list') {
      iconClass = 'fa fa-list';
    }

    if (this.props.type === 'select') {
      iconClass = 'fa fa-sort';
    }

    if (this.props.type === 'date') {
      iconClass = 'fa fa-calendar';
    }

    if (this.props.type === 'checkbox') {
      iconClass = 'fa fa-check-square-o';
    }

    return (
      connectDragSource(
        <li className="list-group-item" >
          <i className="fa fa-clone"></i>&nbsp;
          <i className={iconClass}></i>&nbsp;{label}
        </li>
      )
    );
  }
}

PropertyOption.propTypes = {
  connectDragSource: PropTypes.func.isRequired,
  label: PropTypes.string.isRequired,
  type: PropTypes.string.isRequired
};

const optionSource = {
  beginDrag(props) {
    return {label: props.label, type: props.type};
  },

  endDrag(props, monitor) {
    const item = monitor.getItem();
    const dropResult = monitor.getDropResult();
    if (!dropResult) {
      return props.removeProperty(item.index);
    }
  }
};

let dragSource = DragSource('METADATA_OPTION', optionSource, (connector) => ({
  connectDragSource: connector.dragSource()
}))(PropertyOption);

export {dragSource as dragSource};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({removeProperty}, dispatch);
}

export default connect(null, mapDispatchToProps, null, {withRef: true})(dragSource);
