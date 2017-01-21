import React, {PropTypes, Component} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {DropTarget} from 'react-dnd';
import {Form} from 'react-redux-form';
import {I18NLink} from 'app/I18N';
import {actions as formActions, Field} from 'react-redux-form';

import {inserted, addProperty} from 'app/Templates/actions/templateActions';
import MetadataProperty from 'app/Templates/components/MetadataProperty';
import RemovePropertyConfirm from 'app/Templates/components/RemovePropertyConfirm';
import validator from './ValidateTemplate';
import ShowIf from 'app/App/ShowIf';

export class MetadataTemplate extends Component {

  render() {
    const {connectDropTarget, formState} = this.props;
    let nameGroupClass = 'template-name form-group';
    if (formState.name && !formState.name.valid && (formState.$form.submitFailed || formState.name.dirty)) {
      nameGroupClass += ' has-error';
    }

    return <div>
            <RemovePropertyConfirm />
            <Form
              model="template.data"
              onSubmit={this.props.saveTemplate}
              className="metadataTemplate panel-default panel"
              validators={validator(this.props.template.properties, this.props.templates.toJS(), this.props.template._id)}
            >
              <div className="metadataTemplate-heading panel-heading">
                <I18NLink to={this.props.backUrl} className="btn btn-default"><i className="fa fa-arrow-left"></i> Back</I18NLink>
                &nbsp;
                <div className={nameGroupClass}>
                  <Field model=".name">
                    <input placeholder="Template name" className="form-control"/>
                  </Field>
                  <ShowIf if={formState.name && formState.name.touched && formState.name.errors.duplicated}>
                    <div className="validation-error">
                      <i className="fa fa-exclamation-triangle"></i>&nbsp;Duplicated name
                    </div>
                  </ShowIf>
                </div>
                &nbsp;
                <button type="submit" className="btn btn-success save-template" disabled={!!this.props.savingTemplate}>
                  <i className="fa fa-save"/> Save
                </button>
              </div>

              {connectDropTarget(
                <ul className="metadataTemplate-list list-group">
                  {this.props.template.properties.map((config, index) => {
                    return <MetadataProperty {...config} key={config.localID} index={index}/>;
                  })}
                  <div className="no-properties">
                    <span className="no-properties-wrap"><i className="fa fa-clone"></i>Drag properties here</span>
                  </div>
                </ul>
              )}

            </Form>
          </div>;
  }
}

MetadataTemplate.propTypes = {
  connectDropTarget: PropTypes.func.isRequired,
  formState: PropTypes.object,
  backUrl: PropTypes.string,
  saveTemplate: PropTypes.func,
  savingTemplate: PropTypes.bool,
  setErrors: PropTypes.func,
  template: PropTypes.object,
  templates: PropTypes.object
};

const target = {
  canDrop() {
    return true;
  },

  drop(props, monitor) {
    let item = monitor.getItem();

    let propertyAlreadyAdded = props.template.properties[item.index];

    if (propertyAlreadyAdded) {
      props.inserted(item.index);
      return;
    }

    props.addProperty({label: item.label, type: item.type}, props.template.properties.length);
    return {name: 'container'};
  }
};

let dropTarget = DropTarget('METADATA_OPTION', target, (connector) => ({
  connectDropTarget: connector.dropTarget()
}))(MetadataTemplate);

export {dropTarget};

const mapStateToProps = (state) => {
  return {
    template: state.template.data,
    templates: state.templates,
    savingTemplate: state.template.uiState.get('savingTemplate'),
    formState: state.template.formState
  };
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({inserted, addProperty, setErrors: formActions.setErrors}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps, null, {withRef: true})(dropTarget);
