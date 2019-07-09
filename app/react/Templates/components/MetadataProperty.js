import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { DragSource, DropTarget } from 'react-dnd';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { editProperty } from 'app/Templates/actions/uiActions';
import { showModal } from 'app/Modals/actions/modalActions';
import { reorderProperty, addProperty } from 'app/Templates/actions/templateActions';
import ShowIf from 'app/App/ShowIf';
import { Icon } from 'UI';
import FormConfigInput from './FormConfigInput';
import FormConfigSelect from './FormConfigSelect';
import FormConfigRelationship from './FormConfigRelationship';
import FormConfigRelationshipFilter from './FormConfigRelationshipFilter';
import FormConfigNested from './FormConfigNested';
import FormConfigCommon from './FormConfigCommon';
import FormConfigMultimedia from './FormConfigMultimedia';
import Icons from './Icons';


export class MetadataProperty extends Component {
  renderForm() {
    const { type, index } = this.props;
    let defaultInput = <FormConfigInput type={type} index={index} />;

    if (this.props.isCommonProperty) {
      return <FormConfigCommon index={index} type={type}/>;
    }
    if (type === 'relationship') {
      defaultInput = <FormConfigRelationship index={index} type={type}/>;
    }
    if (type === 'relationshipfilter') {
      defaultInput = <FormConfigRelationshipFilter index={index} type={type}/>;
    }
    if (type === 'select' || type === 'multiselect') {
      defaultInput = <FormConfigSelect index={index} type={type}/>;
    }
    if (type === 'nested') {
      defaultInput = <FormConfigNested index={index} type={type}/>;
    }
    if (type === 'media' || type === 'image' || type === 'preview') {
      defaultInput = (
        <FormConfigMultimedia
          type={type}
          index={index}
          canSetStyle={type === 'image' || type === 'preview'}
          canBeRequired={type !== 'preview'}
        />
      );
    }
    if (type === 'geolocation' || type === 'link') {
      defaultInput = <FormConfigInput type={type} index={index} canBeFilter={false}/>;
    }
    return defaultInput;
  }

  isLabelDuplicated() {
    const { index, template, formState } = this.props;
    const commonPropIndex = index + template.commonProperties.length;
    return Boolean(formState.$form.errors[`properties.${index}.label.duplicated`]) ||
      Boolean(formState.$form.errors[`commonProperties.${commonPropIndex}.label.duplicated`]);
  }

  isErrorOnThisField(error) {
    const { index, isCommonProperty, template } = this.props;
    const commonPropIndex = index + template.commonProperties.length;
    const [errorRoot, errorIndex] = error.split('.');
    return errorRoot === 'commonProperties' ?
      errorIndex === commonPropIndex.toString() && isCommonProperty :
      errorIndex === index.toString() && !isCommonProperty;
  }

  render() {
    const { label, connectDragSource, isDragging, connectDropTarget, uiState, index, localID, inserting, formState } = this.props;
    const { editingProperty } = uiState.toJS();

    let propertyClass = 'list-group-item';
    if (isDragging || inserting) {
      propertyClass += ' dragging';
    }

    const hasErrors = Object.keys(formState.$form.errors)
    .reduce((result, error) => result || this.isErrorOnThisField(error) && formState.$form.errors[error], false);
    if (hasErrors && formState.$form.submitFailed) {
      propertyClass += ' error';
    }

    const iconClass = Icons[this.props.type] || 'font';
    const beingEdited = editingProperty === localID;

    const property = (
      <div className={propertyClass}>
        <span className="property-name">
          <Icon icon={this.props.isCommonProperty ? 'lock' : 'bars'} fixedWidth />
          <Icon icon={iconClass} fixedWidth /> {label}
        </span>
        <div className="list-group-item-actions">

          {this.isLabelDuplicated() && (
            <span className="validation-error">
              <Icon icon="exclamation-triangle" /> Duplicated label
            </span>
          )}
          {Boolean(formState.$form.errors[`properties.${index}.relationType.duplicated`]) && (
            <span className="validation-error">
              <Icon icon="exclamation-triangle" /> Relationship fields must have diferent relationship or diferent type of entity.
            </span>
          )}
          <button
            type="button"
            className="btn btn-default btn-xs property-edit"
            onClick={() => this.props.editProperty(beingEdited ? null : localID)}
          >
            <Icon icon="pencil-alt" /> Edit
          </button>
          { !this.props.isCommonProperty && (
          <button
            type="button"
            className="btn btn-danger btn-xs property-remove"
            onClick={() => this.props.removeProperty('RemovePropertyModal', index)}
          >
            <Icon icon="trash-alt" /> Delete
          </button>
)}
        </div>
      </div>
    );

    if (this.props.isCommonProperty) {
      return (
        <li>
          {property}
          <ShowIf if={beingEdited && !isDragging}>
            <div className={`propery-form${editingProperty === localID ? ' expand' : ''}`}>
              {this.renderForm()}
            </div>
          </ShowIf>
        </li>
      );
    }

    return connectDropTarget(
      <li>
        {connectDragSource(property)}
        <ShowIf if={beingEdited && !isDragging}>
          <div className={`propery-form${editingProperty === localID ? ' expand' : ''}`}>
            {this.renderForm()}
          </div>
        </ShowIf>
      </li>
    );
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
  formState: PropTypes.object,
  template: PropTypes.object
};


const target = {

  hover(props, monitor) {
    const dragIndex = monitor.getItem().index;
    const hoverIndex = props.index;
    const item = monitor.getItem();
    if (props.localID === item.editingProperty) {
      props.editProperty(null);
    }
    if (typeof dragIndex === 'undefined') {
      item.inserting = true;
      item.index = 0;
      props.addProperty({ label: item.label, type: item.type, inserting: true }, 0);
      return;
    }

    if (dragIndex === hoverIndex) {
      return;
    }

    if (item.alreadyReordered) {
      item.alreadyReordered = false;
      return;
    }

    props.reorderProperty(dragIndex, hoverIndex);
    item.index = hoverIndex;
    item.alreadyReordered = true;
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
      type: props.type,
      editingProperty: props.uiState.get('editingProperty')
    };
  },
  endDrag(props, monitor) {
    const item = monitor.getItem();
    props.editProperty(item.editingProperty);
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
  formState: template.formState,
  template: template.data
});

export { dragSource, dropTarget };

export default connect(mapStateToProps, mapDispatchToProps)(dragSource);
