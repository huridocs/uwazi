import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { DragSource, DropTarget } from 'react-dnd';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { editProperty } from 'app/Templates/actions/uiActions';
import { showModal } from 'app/Modals/actions/modalActions';
import { reorderProperty, addProperty } from 'app/Templates/actions/templateActions';
import FormConfigInput from './FormConfigInput';
import FormConfigSelect from './FormConfigSelect';
import FormConfigRelationship from './FormConfigRelationship';
import FormConfigNested from './FormConfigNested';
import FormConfigCommon from './FormConfigCommon';
import ShowIf from 'app/App/ShowIf';
import Icons from './Icons';

export class MetadataProperty extends Component {
  renderForm() {
    if (this.props.isCommonProperty) {
      return <FormConfigCommon formKey={this.props.localID} index={this.props.index} />;
    }
    if (this.props.type === 'relationship') {
      return <FormConfigRelationship formKey={this.props.localID} index={this.props.index} />;
    }
    if (this.props.type === 'select' || this.props.type === 'multiselect') {
      return <FormConfigSelect formKey={this.props.localID} index={this.props.index} />;
    }
    if (this.props.type === 'nested') {
      return <FormConfigNested formKey={this.props.localID} index={this.props.index} />;
    }
    return <FormConfigInput type={this.props.type} formKey={this.props.localID} index={this.props.index} />;
  }

  hasError(propertyErrors) {
    const errors = Object.keys(propertyErrors);
    return errors.length > 0;
  }

  render() {
    const { label, connectDragSource, isDragging, connectDropTarget, uiState, index, localID, inserting, formState } = this.props;
    const editingProperty = uiState.toJS().editingProperty;

    let propertyClass = 'list-group-item';
    if (isDragging || inserting) {
      propertyClass += ' dragging';
    }

    const hasErrors = Object.keys(formState.$form.errors)
    .reduce((result, error) => result || error.split('.')[1] === index.toString() && formState.$form.errors[error], false);
    if (hasErrors && formState.$form.submitFailed) {
      propertyClass += ' error';
    }

    const iconClass = Icons[this.props.type] || 'fa fa-font';

    if (this.props.isCommonProperty) {
      return (
        <li className="list-group-item">
          <span className="property-name"><i className="fa fa-lock fa-fw" />&nbsp;<i className={iconClass} />&nbsp;{label}</span>
          <div className="list-group-item-actions">
            <button type="button" className="btn btn-default btn-xs property-edit" onClick={() => this.props.editProperty(localID)}>
              <i className="fa fa-pencil" /> Edit
            </button>
            <button type="button" className="btn btn-danger btn-xs property-remove" disabled>
              <i className="fa fa-trash" /> Delete
            </button>
          </div>
          <ShowIf if={editingProperty === localID}>
            <div className={`propery-form${editingProperty === localID ? ' expand' : ''}`}>
              {this.renderForm()}
            </div>
          </ShowIf>
        </li>
      );
    }

    return connectDragSource(connectDropTarget(
      <li className={propertyClass}>
        <span className="property-name"><i className="fa fa-reorder fa-fw" />&nbsp;<i className={iconClass} />&nbsp;{label}</span>
        <div className="list-group-item-actions">
          <ShowIf if={formState.$form.errors[`properties.${index}.label.duplicated`]}>
            <span className="validation-error">
              <i className="fa fa-exclamation-triangle" />&nbsp;Duplicated label&nbsp;
            </span>
          </ShowIf>
          <button type="button" className="btn btn-default btn-xs property-edit" onClick={() => this.props.editProperty(localID)}>
            <i className="fa fa-pencil" /> Edit
          </button>
          <button
            type="button"
            className="btn btn-danger btn-xs property-remove"
            onClick={() => this.props.removeProperty('RemovePropertyModal', index)}
          >
            <i className="fa fa-trash" /> Delete
          </button>
        </div>
        <ShowIf if={editingProperty === localID}>
          <div className={`propery-form${editingProperty === localID ? ' expand' : ''}`}>
            {this.renderForm()}
          </div>
        </ShowIf>
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
  isCommonProperty: PropTypes.bool,
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
      const item = monitor.getItem();
      item.inserting = true;
      item.index = 0;
      return props.addProperty({ label: item.label, type: item.type, inserting: true }, 0);
    }
    if (dragIndex === hoverIndex) {
      return;
    }
    props.reorderProperty(dragIndex, hoverIndex);
    monitor.getItem().index = hoverIndex;
  }
};

const dropTarget = DropTarget(['METADATA_PROPERTY', 'METADATA_OPTION'], target, connector => ({
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

const dragSource = DragSource('METADATA_PROPERTY', source, (connector, monitor) => ({
  connectDragSource: connector.dragSource(),
  isDragging: monitor.isDragging()
}))(dropTarget);

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ removeProperty: showModal, reorderProperty, addProperty, editProperty }, dispatch);
}

const mapStateToProps = ({ template }) => ({
    uiState: template.uiState,
    formState: template.formState
});

export { dragSource, dropTarget };

export default connect(mapStateToProps, mapDispatchToProps)(dragSource);
