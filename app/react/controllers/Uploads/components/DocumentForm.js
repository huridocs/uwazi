import React, {Component, PropTypes} from 'react';
import {reduxForm} from 'redux-form';

import Select from 'app/Form/components/Select';
import Textarea from 'app/Form/components/Textarea';
import Form from 'app/Form';

export class DocumentForm extends Component {

  render() {

    console.log(this.props.values);

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
      <div>
        <Textarea properties={this.props.fields.title} label="Title" />
        <Select properties={this.props.fields.template} options={options}/>
        <Form fieldsConfig={fieldsConfig} initialValues={this.props.values.metadata} form='document' formKey="metadata" />
      </div>
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
  return {
    fieldsConfig: props.fieldsConfig
  };
}

let form = reduxForm({
  form: 'document',
  fields: ['title', 'template', 'metadata']
},
mapStateToProps
)(DocumentForm);

export default form;
