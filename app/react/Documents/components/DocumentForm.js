import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {Form} from 'react-redux-form';

import {changeTemplate} from '../actions/actions';
import validator from '../utils/documentValidator';

import {FormGroup, FormField, Select} from 'app/Forms';

export class DocumentForm extends Component {
  render() {
    let {document, state} = this.props;
    let templates = this.props.templates.toJS();
    let thesauris = this.props.thesauris.toJS();
    let template = templates.find((t) => t._id === document.template);
    const {model} = this.props;

    //test
    if (!template) {
      return <div />;
    }
    //

    const templateOptions = templates.map((t) => {
      return {label: t.name, value: t._id};
    });

    return (
      <Form id='documentForm' model={model} onSubmit={this.props.onSubmit} validators={validator.generate(template)}>

        <FormGroup {...state.fields.title}>
          <label>Document title <span className="required">*</span></label>
          <FormField model={`${model}.title`}>
            <textarea />
          </FormField>
        </FormGroup>


        <FormGroup>
          <label>Document Type <span className="required">*</span></label>
          <FormField>
            <Select options={templateOptions}
              onChange={(e) => {
                this.props.changeTemplate(model, document, templates.find((t) => t._id === e.target.value));
              }}
            />
          </FormField>
        </FormGroup>

        {template.properties.map((property, index) => {
          return (
            <FormGroup key={index} {...state.fields[`${model}.${property.name}`]} submitFailed={state.submitFailed}>
              <label>
                {property.label}
                {property.required ? <span className="required">*</span> : ''}
              </label>
              <FormField model={`${model}.metadata.${property.name}`} >
                {(() => {
                  if (property.type === 'select') {
                    return <Select options={thesauris.find((t) => t._id === property.content).values} />;
                  }
                  return <input />;
                })()}
              </FormField>
            </FormGroup>
            );
        })}
      </Form>
    );
  }

}

DocumentForm.propTypes = {
  document: PropTypes.object,
  model: PropTypes.string.isRequired,
  state: PropTypes.object,
  templates: PropTypes.object,
  thesauris: PropTypes.object,
  changeTemplate: PropTypes.func,
  onSubmit: PropTypes.func
};

function mapStateToProps({uploads}) {
  return {
    document: uploads.document,
    state: uploads.documentForm
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({changeTemplate}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(DocumentForm);
