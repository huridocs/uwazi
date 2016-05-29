import React, {PropTypes, Component} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {DropTarget} from 'react-dnd';
import {Form} from 'react-redux-form';
import {FormField} from 'app/Forms';
import {Link} from 'react-router';
import {actions as formActions} from 'react-redux-form';

import {inserted, addProperty, saveTemplate} from 'app/Templates/actions/templateActions';
import MetadataProperty from 'app/Templates/components/MetadataProperty';
import RemovePropertyConfirm from 'app/Templates/components/RemovePropertyConfirm';

export class MetadataTemplate extends Component {

  nameValidation() {
    return {required: (val) => val.trim() !== ''};
  }

  handleSubmit(template) {
    if (!this.props.formState.valid) {
      this.props.setSubmitFailed('template.model');
      return;
    }

    this.props.saveTemplate(template);
  }

  render() {
    const {connectDropTarget, formState} = this.props;
    let nameGroupClass = 'template-name form-group';
    if (formState.fields.name && !formState.fields.name.valid && (formState.submitFailed || formState.fields.name.dirty)) {
      nameGroupClass += ' has-error';
    }

    return connectDropTarget(
      <div>
        <RemovePropertyConfirm />
        <Form
          model="template.model"
          onSubmit={this.handleSubmit.bind(this)}
          className="metadataTemplate panel-default panel"
        >
          <div className="metadataTemplate-heading panel-heading">
            <div className={nameGroupClass}>
              <FormField model="template.model.name" validators={this.nameValidation()}>
                <input placeholder="Template name" className="form-control"/>
              </FormField>
            </div>
            &nbsp;
            <Link to="/metadata" className="btn btn-default"><i className="fa fa-arrow-left"></i> Back</Link>
            &nbsp;
            <button type="submit" className="btn btn-success save-template">
              <i className="fa fa-save"/> Save Template
            </button>
          </div>
          <ul className="metadataTemplate-list list-group">
            {(() => {
              if (this.props.properties.length === 0) {
                return <div className="no-properties">
                        <i className="fa fa-clone"></i>Drag properties here to start
                      </div>;
              }
            })()}
            {this.props.properties.map((config, index) => {
              return <MetadataProperty {...config} key={config.localID} index={index}/>;
            })}
          </ul>
        </Form>
      </div>
    );
  }
}

MetadataTemplate.propTypes = {
  connectDropTarget: PropTypes.func.isRequired,
  formState: PropTypes.object,
  saveTemplate: PropTypes.func,
  setSubmitFailed: PropTypes.func,
  properties: PropTypes.array
};

const target = {
  canDrop() {
    return true;
  },

  drop(props, monitor) {
    let item = monitor.getItem();

    let propertyAlreadyAdded = props.properties[item.index];

    if (propertyAlreadyAdded) {
      props.inserted(item.index);
      return;
    }

    props.addProperty({label: item.label, type: item.type}, props.properties.length);
    return {name: 'container'};
  }
};

let dropTarget = DropTarget('METADATA_OPTION', target, (connector) => ({
  connectDropTarget: connector.dropTarget()
}))(MetadataTemplate);

export {dropTarget};

const mapStateToProps = ({template}) => {
  return {
    properties: template.model.properties,
    formState: template.formState
  };
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({inserted, addProperty, saveTemplate, setSubmitFailed: formActions.setSubmitFailed}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps, null, {withRef: true})(dropTarget);
