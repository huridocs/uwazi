import React, {Component, PropTypes} from 'react';
import {reduxForm} from 'redux-form';
import {reset} from 'redux-form';

import Select from 'app/Form/components/Select';
import Textarea from 'app/Form/components/Textarea';
import Form from 'app/Form';
import DocumentFormControls from 'app/controllers/Uploads/components/DocumentFormControls';

export class DocumentForm extends Component {

  handleSubmit(e) {
    e.preventDefault();
    console.log('validating !');
    this.props.handleSubmit(() => {
      console.log(this.props.values);
      console.log('submit !');
    })();
  }

  render() {

    const options = this.props.templates.map((template) => {
      return {label: template.name, value: template._id};
    });

    let fieldsConfig = [];
    if (this.props.values.template) {
      fieldsConfig = this.props.templates.find(template => template._id === this.props.values.template).properties.map((property) => {
        if (property.type === 'select') {
          property.options = this.props.thesauris.find(thesauri => thesauri._id === property.content).values.map((value) => {
            return {label: value.label, value: value.id};
          });
        }
        return property;
      });
    }

    return (
      <form onSubmit={(e) => this.handleSubmit(e)}>
        <Textarea properties={this.props.fields.title} label="Title" />
        <Select properties={this.props.fields.template} options={options}/>
        <Form fieldsConfig={fieldsConfig} initialValues={this.props.initialData.metadata} form='document' formKey="metadata" />
        <button className="btn btn-success save-template">
          <i className="fa fa-save"/> Save
        </button>
      </form>
    );
  }

}

DocumentForm.propTypes = {
  fieldsConfig: PropTypes.array,
  templates: PropTypes.array,
  fields: PropTypes.object,
  values: PropTypes.object,
  thesauris: PropTypes.array
};

export function mapStateToProps(state, props) {

  let metadataFields = [];

  if(state.form.document){
    metadataFields = props.templates.find((template) => {
      return template._id == state.form.document.template.value;
    }).properties.map((property) => {
      return 'metadata.'+property.name;
    })
  }

  // console.log(state.form);
  // console.log(props.templates);
  // console.log(['title', 'template', ...metadataFields]);

  // console.log(metadataFields);

  console.log(props.initialValues);

  return {
    fieldsConfig: props.fieldsConfig,
    fields: ['title', 'template', ...metadataFields],
    initialData: props.initialValues
  };
}

const validate = (values, props) => {
  let errors = {};

  // console.log(values);
  // console.log(props);

  return errors;
};

let form = reduxForm({
  form: 'document',
  validate
},
mapStateToProps
)(DocumentForm);

export default form;
