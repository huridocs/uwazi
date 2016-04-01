import React, {Component, PropTypes} from 'react';
import {DragSource, DropTarget} from 'react-dnd';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';

import {editProperty} from '~/Templates/actions/uiActions';
import {removeProperty, reorderProperty, addProperty} from '~/Templates/actions/templateActions';
import FormConfigInput from '~/Templates/components/FormConfigInput';

export class MetadataProperty extends Component {
  render() {
    const {inserting, label, connectDragSource, isDragging, connectDropTarget, editingProperty, index} = this.props;
    let propertyClass = 'metadata-propery well';
    if (isDragging || inserting) {
      propertyClass += ' dragging';
    }

    return connectDragSource(connectDropTarget(
      <div className={propertyClass}>
        {label}
        <button onClick={() => this.props.removeProperty(index)} className="btn btn-danger property-remove">Delete</button>
        <button onClick={() => this.props.editProperty(index)} className="btn btn-default property-edit">Edit</button>
        <div className={'metadata-propery-form' + (editingProperty === index ? '' : ' collapsed') }>
          <FormConfigInput form={this.props.id} index={this.props.index} />
        </div>
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
  label: PropTypes.string.isRequired,
  inserting: PropTypes.bool,
  removeProperty: PropTypes.func,
  editingProperty: PropTypes.number,
  editProperty: PropTypes.func
};


const target = {
  drop(props) {
    return props;
  },

  hover(props, monitor) {
    const dragIndex = monitor.getItem().index;
    const hoverIndex = props.index;

    if (typeof dragIndex === 'undefined') {
      let item = monitor.getItem();
      item.index = 0;
      return props.addProperty({label: item.label, inserting: true}, item.index);
    }

    props.reorderProperty(dragIndex, hoverIndex);
    monitor.getItem().index = hoverIndex;
  }
};

let dropTarget = DropTarget(['METADATA_PROPERTY', 'METADATA_OPTION'], target, (connector) => ({
  connectDropTarget: connector.dropTarget()
}))(MetadataProperty);

const source = {
  beginDrag(props) {
    return {
      index: props.index,
      label: props.label
    };
  }
};

let dragSource = DragSource('METADATA_PROPERTY', source, (connector, monitor) => ({
  connectDragSource: connector.dragSource(),
  isDragging: monitor.isDragging()
}))(dropTarget);

function mapDispatchToProps(dispatch) {
  return bindActionCreators({removeProperty, reorderProperty, addProperty, editProperty}, dispatch);
}

const mapStateToProps = (state) => {
  return {editingProperty: state.template.uiState.toJS().editingProperty};
};

export {dragSource, dropTarget};
export default connect(mapStateToProps, mapDispatchToProps, null, {withRef: true})(dragSource);
