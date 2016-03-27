import React, {PropTypes, Component} from 'react';
import {connect} from 'react-redux';
import {DropTarget} from 'react-dnd';

const style = {
  height: '12rem',
  width: '12rem',
  marginRight: '1.5rem',
  marginBottom: '1.5rem',
  color: 'black',
  padding: '1rem',
  textAlign: 'center',
  fontSize: '1rem',
  lineHeight: 'normal',
  float: 'left',
  border: '1px solid red'
};

const boxTarget = {
  drop() {
    return {name: 'Dustbin'};
  }
};

class Template extends Component {
  render() {
    const {canDrop, isOver, connectDropTarget} = this.props;
    const isActive = canDrop && isOver;

    let backgroundColor = '#222';
    if (isActive) {
      backgroundColor = 'darkgreen';
    } else if (canDrop) {
      backgroundColor = 'darkkhaki';
    }

    let newStyle = Object.assign({}, style, backgroundColor);

    return connectDropTarget(
      <div style={newStyle}>
        {isActive ?
          'Release to drop' :
          'Drag a box here'
        }
        {this.props.fields.map((field, index) => {
          return (
            <div key={index}>
              {field.fieldType}
            </div>
          );
        })}
      </div>
    );
  }
}

Template.propTypes = {
  connectDropTarget: PropTypes.func.isRequired,
  isOver: PropTypes.bool.isRequired,
  canDrop: PropTypes.bool.isRequired,
  fields: PropTypes.array
};

const mapStateToProps = (state) => {
  return {fields: state.fields.toJS()};
};

let dropTarget = DropTarget('FIELD_OPTIONS', boxTarget, (connector, monitor) => ({
  connectDropTarget: connector.dropTarget(),
  isOver: monitor.isOver(),
  canDrop: monitor.canDrop()
}))(Template);

export default connect(mapStateToProps)(dropTarget);
