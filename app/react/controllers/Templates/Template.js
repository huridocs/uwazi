import React, {PropTypes, Component} from 'react';
import {connect} from 'react-redux';
import {DropTarget} from 'react-dnd';

const boxTarget = {
  drop() {
    return {name: 'Dustbin'};
  }
};

class Template extends Component {
  render() {
    const {canDrop, isOver, connectDropTarget} = this.props;
    const isActive = canDrop && isOver;


    return connectDropTarget(
      <div className="well template">
        {isActive ?
          'Release to drop' :
          'Drag a box here'
        }
        {this.props.fields.map((field, index) => {
          return (
            <div className="field-option well" key={index}>
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
