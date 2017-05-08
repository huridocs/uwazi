import PropTypes from 'prop-types';
import React, {Component} from 'react';
import {DragSource} from 'react-dnd';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';

import {removeProperty} from 'app/Templates/actions/templateActions';
import Icons from './Icons';

export class PropertyOption extends Component {
  render() {
    const {connectDragSource} = this.props;
    const {label} = this.props;
    let iconClass = Icons[this.props.type] || 'fa fa-font';

    return (
      connectDragSource(
        <li className="list-group-item">
          <span>
            <i className="fa fa-clone"></i>
            <i className={iconClass}></i>&nbsp;{label}
          </span>
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
    return Object.assign({}, props);
  },

  endDrag(props, monitor) {
    const item = monitor.getItem();
    const dropResult = monitor.getDropResult();
    if (!dropResult && item.index) {
      props.removeProperty(item.index);
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
