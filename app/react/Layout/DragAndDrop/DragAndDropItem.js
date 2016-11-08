import React, {Component, PropTypes} from 'react';
import {findDOMNode} from 'react-dom';
import {DragSource, DropTarget} from 'react-dnd';

export const itemSource = {
  beginDrag(props) {
    return {
      id: props.id,
      name: props.name,
      items: props.items,
      container: props.container,
      index: props.index
    };
  },

  endDrag(props, monitor) {
    const container = monitor.getDropResult();
    if (container && container.id !== props.container.id) {
      props.removeItem(props.id);
    }
  }
};

export const itemTarget = {
  hover(props, monitor, component) {
    const item = monitor.getItem();
    const dragIndex = item.index;
    const hoverIndex = props.index;

    if (props.id === item.id) {
      return;
    }

    if (props.container.id !== item.container.id) {
      return;
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
    props.moveItem(dragIndex, hoverIndex, item);

    // Note: we're mutating the monitor item here!
    // Generally it's better to avoid mutations,
    // but it's good here for the sake of performance
    // to avoid expensive index searches.
    item.index = hoverIndex;
    return null;
  }
};

export class DragAndDropItem extends Component {
  render() {
    const {isDragging, connectDragSource, connectDropTarget} = this.props;
    let propertyClass = 'list-group-item';
    if (isDragging) {
      propertyClass += ' dragging';
    }

    return connectDragSource(connectDropTarget(
      <div className={propertyClass}>
        {this.props.children}
      </div>
    ));
  }
}

DragAndDropItem.propTypes = {
  connectDragSource: PropTypes.func.isRequired,
  connectDropTarget: PropTypes.func.isRequired,
  index: PropTypes.number.isRequired,
  isDragging: PropTypes.bool.isRequired,
  id: PropTypes.any.isRequired,
  moveItem: PropTypes.func.isRequired,
  children: PropTypes.any
};

let dragAndDropItem = DropTarget('DRAG_AND_DROP_ITEM', itemTarget, connect => ({
  connectDropTarget: connect.dropTarget()
}))(DragAndDropItem);

dragAndDropItem = DragSource('DRAG_AND_DROP_ITEM', itemSource, (connect, monitor) => ({
  connectDragSource: connect.dragSource(),
  isDragging: monitor.isDragging()
}))(dragAndDropItem);

export default dragAndDropItem;
