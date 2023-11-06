import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { DragSource, DropTarget } from 'react-dnd-old';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { editProperty } from 'app/Templates/actions/uiActions';
import { showModal } from 'app/Modals/actions/modalActions';
import { reorderProperty, addProperty } from 'app/Templates/actions/templateActions';
import ShowIf from 'app/App/ShowIf';
import { Icon } from 'UI';
import { StateSelector } from 'app/Review/components/StateSelector';
import { createSelector } from 'reselect';
import { Translate } from 'app/I18N';
import FormConfigInput from './FormConfigInput';
import { FormConfigSelect } from './FormConfigSelect';
import FormConfigRelationship from './FormConfigRelationship';
import FormConfigNested from './FormConfigNested';
import FormConfigCommon from './FormConfigCommon';
import FormConfigMultimedia from './FormConfigMultimedia';
import { FormConfigDate } from './FormConfigDate';
import Icons from './Icons';
import { FormConfigNewRelationship } from './FormConfigNewRelationship';

const isLabelDuplicated = (index, template, formState) => {
  const commonPropIndex = index + template.commonProperties.length;
  return (
    Boolean(formState.$form.errors[`properties.${index}.label.duplicated`]) ||
    Boolean(formState.$form.errors[`commonProperties.${commonPropIndex}.label.duplicated`])
  );
};

const isErrorOnThisField = (error, index, isCommonProperty, template) => {
  const commonPropIndex = index + template.commonProperties.length;
  const [errorRoot, errorIndex] = error.split('.');
  return errorRoot === 'commonProperties'
    ? errorIndex === commonPropIndex.toString() && isCommonProperty
    : errorIndex === index.toString() && !isCommonProperty;
};

class MetadataProperty extends Component {
  renderForm() {
    const { type, index } = this.props;
    let defaultInput = <FormConfigInput type={type} index={index} />;

    if (this.props.isCommonProperty) {
      return <FormConfigCommon index={index} type={type} />;
    }

    switch (type) {
      case 'relationship':
        defaultInput = <FormConfigRelationship index={index} type={type} />;
        break;

      case 'select':
      case 'multiselect':
        defaultInput = <FormConfigSelect index={index} type={type} />;
        break;

      case 'nested':
        defaultInput = <FormConfigNested index={index} type={type} />;
        break;

      case 'media':
      case 'image':
      case 'preview':
        defaultInput = (
          <FormConfigMultimedia
            type={type}
            index={index}
            canSetStyle={type === 'image' || type === 'preview'}
            canBeRequired={type !== 'preview'}
          />
        );
        break;

      case 'geolocation':
      case 'link':
        defaultInput = <FormConfigInput type={type} index={index} canBeFilter={false} />;
        break;

      case 'date':
      case 'daterange':
      case 'multidate':
      case 'multidaterange':
        defaultInput = <FormConfigDate index={index} type={type} />;
        break;

      // relationships v2:
      case 'newRelationship':
        defaultInput = <FormConfigNewRelationship type={type} index={index} />;
        break;

      default:
        defaultInput = <FormConfigInput type={type} index={index} />;
        break;
    }

    return defaultInput;
  }

  render() {
    const {
      label,
      connectDragSource,
      isDragging,
      connectDropTarget,
      uiState,
      index,
      localID,
      inserting,
      hasErrors,
      submitFailed,
    } = this.props;
    const { editingProperty } = uiState.toJS();

    let propertyClass = 'list-group-item';
    if (isDragging || inserting) {
      propertyClass += ' dragging';
    }

    if (hasErrors && submitFailed) {
      propertyClass += ' error';
    }

    const iconClass = Icons[this.props.type] || 'font';
    const beingEdited = editingProperty === localID;

    const property = (
      <div className={propertyClass}>
        <span className="property-name">
          <Icon icon={this.props.isCommonProperty ? 'lock' : 'bars'} fixedWidth />
          <Icon icon={iconClass} fixedWidth />
          {label !== null ? (
            label
          ) : (
            <StateSelector
              // @ts-expect-error
              propertyLabel={createSelector(
                state =>
                  state.template.data.properties[this.props.index]
                    ? state.template.data.properties[this.props.index].label
                    : '',
                value => value
              )}
            >
              {({ propertyLabel }) => propertyLabel}
            </StateSelector>
          )}
        </span>
        <div className="list-group-item-actions">
          {this.props.isLabelDuplicated && (
            <span className="validation-error">
              <Icon icon="exclamation-triangle" /> <Translate>Duplicated label</Translate>
            </span>
          )}
          {this.props.isRelationDuplicated && (
            <span className="validation-error">
              <Icon icon="exclamation-triangle" />
              <Translate translationKey="relationship consistency warning">
                Cannot use &apos;any entity or document&apos; if another relationship of the same
                type is already with a specific entity.
              </Translate>
            </span>
          )}
          {!this.props.syncedTemplate && (
            <>
              <button
                type="button"
                className="btn btn-default btn-xs property-edit"
                onClick={() => this.props.editProperty(beingEdited ? null : localID)}
              >
                <Icon icon="pencil-alt" /> <Translate>Edit</Translate>
              </button>
              {!this.props.isCommonProperty && (
                <button
                  type="button"
                  className="btn btn-danger btn-xs property-remove"
                  onClick={() => this.props.removeProperty('RemovePropertyModal', index)}
                >
                  <Icon icon="trash-alt" /> <Translate>Delete</Translate>
                </button>
              )}
            </>
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

MetadataProperty.defaultProps = {
  label: null,
  submitFailed: false,
  hasErrors: false,
  isLabelDuplicated: false,
  isRelationDuplicated: false,
  syncedTemplate: false,
};

MetadataProperty.propTypes = {
  connectDragSource: PropTypes.func.isRequired,
  connectDropTarget: PropTypes.func.isRequired,
  submitFailed: PropTypes.bool,
  hasErrors: PropTypes.bool,
  isLabelDuplicated: PropTypes.bool,
  isRelationDuplicated: PropTypes.bool,
  index: PropTypes.number.isRequired,
  isDragging: PropTypes.bool.isRequired,
  localID: PropTypes.any.isRequired,
  type: PropTypes.string,
  label: PropTypes.string,
  isCommonProperty: PropTypes.bool,
  inserting: PropTypes.bool,
  removeProperty: PropTypes.func,
  uiState: PropTypes.object,
  editProperty: PropTypes.func,
  syncedTemplate: PropTypes.bool,
  // relationships v2:
  query: PropTypes.array,
  denormalizedProperty: PropTypes.string,
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
  },
};

const dropTarget = DropTarget(['METADATA_PROPERTY', 'METADATA_OPTION'], target, connector => ({
  connectDropTarget: connector.dropTarget(),
}))(MetadataProperty);

const source = {
  beginDrag(props) {
    return {
      index: props.index,
      label: props.label,
      type: props.type,
      editingProperty: props.uiState.get('editingProperty'),
    };
  },
  endDrag(props, monitor) {
    const item = monitor.getItem();
    props.editProperty(item.editingProperty);
  },
};

const dragSource = DragSource('METADATA_PROPERTY', source, (connector, monitor) => ({
  connectDragSource: connector.dragSource(),
  isDragging: monitor.isDragging(),
}))(dropTarget);

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    { removeProperty: showModal, reorderProperty, addProperty, editProperty },
    dispatch
  );
}

const mapStateToProps = ({ template }, ownProps) => ({
  uiState: template.uiState,
  hasErrors: Object.keys(template.formState.$form.errors || {}).reduce(
    (result, error) =>
      result ||
      (isErrorOnThisField(error, ownProps.index, ownProps.isCommonProperty, template.data) &&
        template.formState.$form.errors[error]),
    false
  ),
  isLabelDuplicated: isLabelDuplicated(ownProps.index, template.data, template.formState),
  isRelationDuplicated: Boolean(
    template.formState.$form.errors[`properties.${ownProps.index}.relationType.duplicated`]
  ),
  submitFailed: template.formState.$form.submitFailed,
});

export { dragSource, dropTarget, MetadataProperty };

export default connect(mapStateToProps, mapDispatchToProps)(dragSource);
