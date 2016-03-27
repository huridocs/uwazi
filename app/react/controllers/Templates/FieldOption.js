import React, {Component, PropTypes} from 'react';
import {DragSource} from 'react-dnd';
import {bindActionCreators} from 'redux';
import * as templatesActions from './templatesActions';
import {connect} from 'react-redux';

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
    // const item = monitor.getItem();
    const dropResult = monitor.getDropResult();

    if (dropResult) {
      props.addField({fieldType: 'input'});
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


function mapDispatchToProps(dispatch) {
  return bindActionCreators(templatesActions, dispatch);
}

let dragSource = DragSource('FIELD_OPTIONS', boxSource, (connector, monitor) => ({
  connectDragSource: connector.dragSource(),
  isDragging: monitor.isDragging()
}))(FieldOption);

export default connect(null, mapDispatchToProps)(dragSource);
