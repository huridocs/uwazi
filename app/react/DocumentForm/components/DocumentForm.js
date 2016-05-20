import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {Form} from 'react-redux-form';
import {changeTemplate} from 'app/DocumentForm/actions/actions';
import validator from 'app/DocumentForm/utils/documentValidator';

import {FormGroup, FormField, Select} from 'app/Forms';

export class DocumentForm extends Component {
  render() {
    let {document, state} = this.props;
    let templates = this.props.templates.toJS();
    let thesauris = this.props.thesauris.toJS();
    let template = templates.find((t) => t._id === document.template);

    //test
    if (!template) {
      return <div />;
    }
    //

    const templateOptions = templates.map((t) => {
      return {label: t.name, value: t._id};
    });

    return (
      <Form id='documentForm' model="document" onSubmit={this.props.onSubmit} validators={validator.generate(template)}>

        <FormGroup {...state.fields.title}>
          <label>Document title <span className="required">*</span></label>
          <FormField model="document.title">
            <textarea />
          </FormField>
        </FormGroup>


        <FormGroup>
          <label>Document Type <span className="required">*</span></label>
          <FormField>
            <Select options={templateOptions}
              onChange={(e) => {
                this.props.changeTemplate(document, templates.find((t) => t._id === e.target.value));
              }}
            />
          </FormField>
        </FormGroup>

        {template.properties.map((property, index) => {
          return (
            <FormGroup key={index} {...state.fields[`metadata.${property.name}`]} submitFailed={state.submitFailed}>
              <label>
                {property.label}
                {property.required ? <span className="required">*</span> : ''}
              </label>
              <FormField model={`document.metadata.${property.name}`} >
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
  state: PropTypes.object,
  templates: PropTypes.object,
  thesauris: PropTypes.object,
  changeTemplate: PropTypes.func,
  onSubmit: PropTypes.func
};

DocumentForm.contextTypes = {
  store: PropTypes.object
};

function mapStateToProps(state) {
  return {
    document: state.document,
    state: state.documentForm
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({changeTemplate}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(DocumentForm);
