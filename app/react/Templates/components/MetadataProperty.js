import React, {Component, PropTypes} from 'react';
import {DragSource, DropTarget} from 'react-dnd';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';

import {editProperty} from 'app/Templates/actions/uiActions';
import {removeProperty, reorderProperty, addProperty} from 'app/Templates/actions/templateActions';
import FormConfigInput from 'app/Templates/components/FormConfigInput';
import FormConfigSelect from 'app/Templates/components/FormConfigSelect';

export class MetadataProperty extends Component {

  renderForm() {
    if (this.props.type === 'select' || this.props.type === 'list') {
      return <FormConfigSelect formKey={this.props.id} index={this.props.index} />;
    }
    return <FormConfigInput formKey={this.props.id} index={this.props.index} />;
  }

  hasError(form) {
    if (Object.keys(form).length === 0) {
      return false;
    }

    let labelError = false;
    if (form.label.touched && !form.label.value) {
      labelError = true;
    }

    let contentError = false;
    let hasContent = this.props.type === 'select' || this.props.type === 'list';
    if (hasContent && form.content.touched && !form.content.value) {
      contentError = true;
    }

    return labelError || contentError;
  }

  render() {
    const {inserting, label, connectDragSource, isDragging, connectDropTarget, editingProperty, index, localID, form} = this.props;
    let propertyClass = 'list-group-item';

    if (this.hasError(form)) {
      propertyClass += ' error';
    }

    if (isDragging || inserting) {
      propertyClass += ' dragging';
    }

    let iconClass = 'fa fa-font';
    if (this.props.type === 'select' || this.props.type === 'list') {
      iconClass = 'fa fa-list';
    }

    if (this.props.type === 'date') {
      iconClass = 'fa fa-calendar';
    }

    if (this.props.type === 'checkbox') {
      iconClass = 'fa fa-check-square-o';
    }

    return connectDragSource(connectDropTarget(
      <li className={propertyClass}>
        <div>
           <i className="fa fa-arrows-v"></i>&nbsp;<i className={iconClass}></i>&nbsp;{label}
          <button className="btn btn-danger btn-xs pull-right property-remove" onClick={() => this.props.removeProperty(index)}>
            <i className="fa fa-trash"></i> Delete
          </button>
          &nbsp;
          <button className="btn btn-default btn-xs pull-right property-edit" onClick={() => this.props.editProperty(localID)}>
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
  editingProperty: PropTypes.string,
  editProperty: PropTypes.func,
  form: PropTypes.object
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
      return props.addProperty({label: item.label, type: item.type, inserting: true}, item.index);
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
  return bindActionCreators({removeProperty, reorderProperty, addProperty, editProperty}, dispatch);
}

const mapStateToProps = (state, props) => {
  return {
    editingProperty: state.template.uiState.toJS().editingProperty,
    form: state.form.template[props.localID] || {}
  };
};

export {dragSource, dropTarget};
export default connect(mapStateToProps, mapDispatchToProps, null, {withRef: true})(dragSource);
