import React, {Component, PropTypes} from 'react';
import {findDOMNode} from 'react-dom';
import {DragSource, DropTarget} from 'react-dnd';
import {bindActionCreators} from 'redux';
import * as templatesActions from './templatesActions';
import {connect} from 'react-redux';

const cardSource = {
  beginDrag(props) {
    return {
      id: props.id,
      index: props.index,
      type: 'METADATA_PROPERTY'
    };
  }
};

const cardTarget = {
  drop(props) {
    return props;
  },

  hover(props, monitor, component) {
    const dragIndex = monitor.getItem().index;
    const hoverIndex = props.index;

    if (typeof dragIndex === 'undefined') {
      let item = monitor.getItem();
      item.index = 0;
      return props.addField({name: item.name, inserting: true}, item.index);
    }

    // Don't replace items with themselves
    if (dragIndex === hoverIndex) {
      return;
    }

    // Determine rectangle on screen
    const hoverBoundingRect = findDOMNode(component).getBoundingClientRect();

    // Get vertical middle
    const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;

    // Determine mouse position
    const clientOffset = monitor.getClientOffset();

    // Get pixels to the top
    const hoverClientY = clientOffset.y - hoverBoundingRect.top;

    // Only perform the move when the mouse has crossed half of the items height
    // When dragging downwards, only move when the cursor is below 50%
    // When dragging upwards, only move when the cursor is above 50%

    // Dragging downwards
    if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
      return;
    }

    // Dragging upwards
    if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
      return;
    }

    // Time to actually perform the action
    props.reorderProperty(dragIndex, hoverIndex);

    // Note: we're mutating the monitor item here!
    // Generally it's better to avoid mutations,
    // but it's good here for the sake of performance
    // to avoid expensive index searches.
    monitor.getItem().index = hoverIndex;
  }
};

class MetadataProperty extends Component {
  render() {
    const {inserting, name, connectDragSource, isDragging, connectDropTarget} = this.props;
    let propertyClass = 'field-option well';
    if (isDragging || inserting) {
      propertyClass += ' dragging';
    }

    return connectDragSource(connectDropTarget(
      <div className={propertyClass}>
        {name}
      </div>
    ));
  }
}

MetadataProperty.propTypes = {
  connectDragSource: PropTypes.func.isRequired,
  connectDropTarget: PropTypes.func.isRequired,
  index: PropTypes.number.isRequired,
  isDragging: PropTypes.bool.isRequired,
  id: PropTypes.any.isRequired,
  name: PropTypes.string.isRequired,
  inserting: PropTypes.bool
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators(templatesActions, dispatch);
}

let dropTarget = DropTarget(['METADATA_PROPERTY', 'METADATA_OPTION'], cardTarget, (connector, monitor) => ({
  connectDropTarget: connector.dropTarget(),
  isOver: monitor.isOver()
}))(MetadataProperty);
let dragSource = DragSource('METADATA_PROPERTY', cardSource, (connector, monitor) => ({
  connectDragSource: connector.dragSource(),
  isDragging: monitor.isDragging()
}))(dropTarget);

export default connect(null, mapDispatchToProps)(dragSource);
