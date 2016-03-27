import React, {Component, PropTypes} from 'react';
import {DragSource} from 'react-dnd';
import {bindActionCreators} from 'redux';
import * as templatesActions from './templatesActions';
import {connect} from 'react-redux';

const boxSource = {
  beginDrag(props) {
    return {
      name: props.name
    };
  },

  endDrag(props, monitor) {
    const item = monitor.getItem();
    const dropResult = monitor.getDropResult();

    if (dropResult) {
      props.addField({fieldType: 'input', name: item.name}, dropResult.index);
    }
  }
};

class PropertyOption extends Component {
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
  isDragging: PropTypes.bool.isRequired,
  name: PropTypes.string.isRequired
};


function mapDispatchToProps(dispatch) {
  return bindActionCreators(templatesActions, dispatch);
}

let dragSource = DragSource('METADATA_OPTION', boxSource, (connector, monitor) => ({
  connectDragSource: connector.dragSource(),
  isDragging: monitor.isDragging()
}))(PropertyOption);

export default connect(null, mapDispatchToProps)(dragSource);
