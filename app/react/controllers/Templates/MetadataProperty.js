import React, {Component, PropTypes} from 'react';
import {DragSource, DropTarget} from 'react-dnd';
import {bindActionCreators} from 'redux';
import {reorderProperty, addProperty} from './templatesActions';
import {connect} from 'react-redux';
import FormConfigInput from '~/controllers/Templates/FormConfigInput';

export class MetadataProperty extends Component {
  render() {
    const {inserting, label, connectDragSource, isDragging, connectDropTarget} = this.props;
    let propertyClass = 'field-option well';
    if (isDragging || inserting) {
      propertyClass += ' dragging';
    }

    return connectDragSource(connectDropTarget(
      <div className={propertyClass}>
        {label}
        <div>
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
  inserting: PropTypes.bool
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
  return bindActionCreators({reorderProperty, addProperty}, dispatch);
}

export {dragSource, dropTarget};
export default connect(null, mapDispatchToProps, null, {withRef: true})(dragSource);
