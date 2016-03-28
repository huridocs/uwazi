import React, {PropTypes, Component} from 'react';
import {connect} from 'react-redux';
import {DropTarget} from 'react-dnd';
import MetadataProperty from './MetadataProperty';

const boxTarget = {
  drop() {
    return {index: 0, name: 'container'};
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
    const {connectDropTarget} = this.props;

    return connectDropTarget(
      <div className="well template">
      {(() => {
        if (this.props.fields.length === 0) {
          return <h1>Drag properties here to start</h1>;
        }
      })()}
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
