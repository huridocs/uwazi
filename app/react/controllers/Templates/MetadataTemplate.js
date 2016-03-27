import React, {PropTypes, Component} from 'react';
import {connect} from 'react-redux';
import {DropTarget} from 'react-dnd';
import MetadataProperty from './MetadataProperty';

const boxTarget = {
  drop() {
    return {index: 0};
  },

  canDrop(props) {
    if (props.fields.length > 0) {
      return false;
    }
    return true;
  }
};

class MetadataTemplate extends Component {
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
        return <MetadataProperty {...field} key={field.id} index={index}/>;
      })}
      </div>
    );
  }
}

MetadataTemplate.propTypes = {
  connectDropTarget: PropTypes.func.isRequired,
  isOver: PropTypes.bool.isRequired,
  canDrop: PropTypes.bool.isRequired,
  fields: PropTypes.array
};

const mapStateToProps = (state) => {
  return {fields: state.fields.toJS()};
};

let dropTarget = DropTarget('METADATA_OPTION', boxTarget, (connector, monitor) => ({
  connectDropTarget: connector.dropTarget(),
  isOver: monitor.isOver(),
  canDrop: monitor.canDrop()
}))(MetadataTemplate);

export default connect(mapStateToProps)(dropTarget);
