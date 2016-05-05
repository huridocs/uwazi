import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {Field, Form} from 'react-redux-form';
import {changeTemplate} from 'app/DocumentForm/actions/actions';
import Select, {SelectField} from 'app/DocumentForm/components/Select';
import FormGroup from 'app/DocumentForm/components/FormGroup';
import validator from 'app/DocumentForm/utils/documentValidator';

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
          <Field model="document.title">
            <ul className="search__filter">
              <li>Document title <span className="required">*</span></li>
              <li className="wide"><textarea className="form-control" /></li>
            </ul>
          </Field>
        </FormGroup>


        <FormGroup>
          <ul className="search__filter">
            <li>Document Type <span className="required">*</span></li>
            <li className="wide">
              <Select options={templateOptions}
                onChange={(e) => {
                  this.props.changeTemplate(document, templates.find((t) => t._id === e.target.value));
                }}
              />
            </li>
          </ul>
        </FormGroup>

        {template.properties.map((property, index) => {
          if (property.type === 'select') {
            return (
              <FormGroup key={index} {...state.fields[`metadata.${property.name}`]} submitFailed={state.submitFailed}>
                <SelectField model={`document.metadata.${property.name}`} >
                  <ul className="search__filter">
                    <li>
                      {property.label}
                      {property.required ? <span className="required">*</span> : ''}
                    </li>
                    <li className="wide"><Select options={thesauris.find((t) => t._id === property.content).values} /></li>
                  </ul>
                </SelectField>
              </FormGroup>
              );
          }
          return (
            <FormGroup key={index} {...state.fields[`metadata.${property.name}`]} submitFailed={state.submitFailed}>
              <Field model={`document.metadata.${property.name}`} >
                <ul className="search__filter">
                  <li>
                    {property.label}
                    {property.required ? <span className="required">*</span> : ''}
                  </li>
                  <li className="wide"><input className="form-control" /></li>
                </ul>
              </Field>
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
