import React, {Component, PropTypes} from 'react';
import {DragSource} from 'react-dnd';
import {bindActionCreators} from 'redux';
import {removeProperty} from './templatesActions';
import {connect} from 'react-redux';

export class PropertyOption extends Component {
  render() {
    const {connectDragSource} = this.props;
    const {name} = this.props;
    return (
      connectDragSource(
        <div className="field-option well">
          {name}
        </div>
      )
    );
  }
}

PropertyOption.propTypes = {
  connectDragSource: PropTypes.func.isRequired,
  name: PropTypes.string.isRequired
};

const optionSource = {
  beginDrag(props) {
    return {name: props.name};
  },

  endDrag(props, monitor) {
    const item = monitor.getItem();
    const dropResult = monitor.getDropResult();

    if (!dropResult && typeof item.index !== 'undefined') {
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
