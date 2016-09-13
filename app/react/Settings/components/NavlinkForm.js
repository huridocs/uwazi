import React, {Component, PropTypes} from 'react';
import {findDOMNode} from 'react-dom';
// import ItemTypes from './ItemTypes';
import {DragSource, DropTarget} from 'react-dnd';


const Types = {
  LINK: 'link'
};

const style = {
  border: '1px dashed gray',
  padding: '0.5rem 1rem',
  marginBottom: '.5rem',
  backgroundColor: 'white',
  cursor: 'move'
};

const LinkSource = {
  beginDrag(props) {
    return {
      id: props.localID,
      index: props.index
    };
  }
};

const LinkTarget = {
  hover(props, monitor, component) {
    const dragIndex = monitor.getItem().index;
    const hoverIndex = props.index;

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
    props.moveLink(dragIndex, hoverIndex);

    // Note: we're mutating the monitor item here!
    // Generally it's better to avoid mutations,
    // but it's good here for the sake of performance
    // to avoid expensive index searches.
    monitor.getItem().index = hoverIndex;
  }
};

export class NavlinkForm extends Component {
  render() {
    const {link, index, isDragging, connectDragSource, connectDropTarget} = this.props;
    const opacity = isDragging ? 0 : 1;

    const computedStyle = Object.assign({opacity}, style);

    return connectDragSource(connectDropTarget(
      <li className="list-group-item" style={computedStyle} key={link.localID} index={index}>
        {link.title}
      </li>
    ));
  }
}

NavlinkForm.propTypes = {
  connectDragSource: PropTypes.func.isRequired,
  connectDropTarget: PropTypes.func.isRequired,
  index: PropTypes.number.isRequired,
  isDragging: PropTypes.bool.isRequired,
  id: PropTypes.any.isRequired,
  link: PropTypes.object.isRequired,
  moveLink: PropTypes.func.isRequired
};

const dropTarget = DropTarget(Types.LINK, LinkTarget, connect => ({
  connectDropTarget: connect.dropTarget()
}))(NavlinkForm);

const dragSource = DragSource(Types.LINK, LinkSource, (connect, monitor) => ({
  connectDragSource: connect.dragSource(),
  isDragging: monitor.isDragging()
}))(dropTarget);

export default dragSource;
