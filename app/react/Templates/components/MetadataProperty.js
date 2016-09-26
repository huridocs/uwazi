import React, {Component, PropTypes} from 'react';
import {DragSource, DropTarget} from 'react-dnd';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';

import {editProperty} from 'app/Templates/actions/uiActions';
import {showModal} from 'app/Modals/actions/modalActions';
import {reorderProperty, addProperty} from 'app/Templates/actions/templateActions';
import FormConfigInput from './FormConfigInput';
import FormConfigSelect from './FormConfigSelect';
import FormConfigNested from './FormConfigNested';
import Icons from './Icons';

export class MetadataProperty extends Component {

  renderForm() {
    if (this.props.type === 'select' || this.props.type === 'multiselect') {
      return <FormConfigSelect formKey={this.props.localID} index={this.props.index} />;
    }
    if (this.props.type === 'nested') {
      return <FormConfigNested formKey={this.props.localID} index={this.props.index} />;
    }
    return <FormConfigInput formKey={this.props.localID} index={this.props.index} />;
  }

  hasError(propertyErrors) {
    let errors = Object.keys(propertyErrors);
    return errors.length > 0;
  }

  render() {
    const {label, connectDragSource, isDragging, connectDropTarget, uiState, index, localID, inserting, formState} = this.props;
    const editingProperty = uiState.toJS().editingProperty;

    let propertyClass = 'list-group-item';
    if (isDragging || inserting) {
      propertyClass += ' dragging';
    }

    if (formState.errors[`properties.${index}.label.required`] || formState.errors[`properties.${index}.label.duplicated`]) {
      propertyClass += ' error';
    }

    let iconClass = Icons[this.props.type] || 'fa fa-font';

    return connectDragSource(connectDropTarget(
      <li className={propertyClass}>
        <div>
           <span className="property-name"><i className="fa fa-reorder"></i>&nbsp;<i className={iconClass}></i>&nbsp;{label}</span>
           <button type="button" className="btn btn-danger btn-xs pull-right property-remove" onClick={() =>
             this.props.removeProperty('RemovePropertyModal', index)}
           >
            <i className="fa fa-trash"></i> Delete
          </button>
          &nbsp;
          <button type="button" className="btn btn-default btn-xs pull-right property-edit" onClick={() => this.props.editProperty(localID)}>
            <i className="fa fa-pencil"></i> Edit
          </button>
        </div>
        <div className={'propery-form' + (editingProperty === localID ? ' expand' : '') }>
          {this.renderForm()}
        </div>
      </li>
    ));
  }
}

MetadataProperty.propTypes = {
  connectDragSource: PropTypes.func.isRequired,
  connectDropTarget: PropTypes.func.isRequired,
  index: PropTypes.number.isRequired,
  isDragging: PropTypes.bool.isRequired,
  localID: PropTypes.any.isRequired,
  type: PropTypes.string,
  label: PropTypes.string.isRequired,
  inserting: PropTypes.bool,
  removeProperty: PropTypes.func,
  uiState: PropTypes.object,
  editProperty: PropTypes.func,
  formState: PropTypes.object
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
      item.inserting = true;
      return props.addProperty(item, 0);
    }
    if (dragIndex === hoverIndex) {
      return;
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
      label: props.label,
      type: props.type
    };
  }
};

let dragSource = DragSource('METADATA_PROPERTY', source, (connector, monitor) => ({
  connectDragSource: connector.dragSource(),
  isDragging: monitor.isDragging()
}))(dropTarget);

function mapDispatchToProps(dispatch) {
  return bindActionCreators({removeProperty: showModal, reorderProperty, addProperty, editProperty}, dispatch);
}

const mapStateToProps = (state) => {
  return {
    uiState: state.template.uiState,
    formState: state.template.formState
  };
};

export {dragSource, dropTarget};

export default connect(mapStateToProps, mapDispatchToProps)(dragSource);
