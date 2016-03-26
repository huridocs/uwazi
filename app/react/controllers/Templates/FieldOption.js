import React, {Component, PropTypes} from 'react';
import {DragSource} from 'react-dnd';

const style = {
  border: '1px dashed gray',
  backgroundColor: 'white',
  padding: '0.5rem 1rem',
  marginRight: '1.5rem',
  marginBottom: '1.5rem',
  cursor: 'move',
  float: 'left'
};

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
      window.alert( // eslint-disable-line no-alert
        `You dropped ${item.name} into ${dropResult.name}!`
      );
    }
  }
};

class FieldOption extends Component {
  render() {
    const {isDragging, connectDragSource} = this.props;
    const {name} = this.props;
    const opacity = isDragging ? 0.4 : 1;
    let newStyle = Object.assign({}, style, opacity);

    return (
      connectDragSource(
        <div style={newStyle}>
          {name}
        </div>
      )
    );
  }
}

FieldOption.propTypes = {
  connectDragSource: PropTypes.func.isRequired,
  isDragging: PropTypes.bool.isRequired,
  name: PropTypes.string.isRequired
};

export default DragSource('FIELD_OPTIONS', boxSource, (connect, monitor) => ({
  connectDragSource: connect.dragSource(),
  isDragging: monitor.isDragging()
}))(FieldOption);
