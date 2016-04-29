import React, {Component, PropTypes} from 'react';
import {reduxForm} from 'redux-form';
import {bindActionCreators} from 'redux';

import Select from 'app/Form/components/Select';
import Textarea from 'app/Form/components/Textarea';
import {DynamicFields} from 'app/Form';
import {prepareTemplateFields, validate, generateValidation} from 'app/Form';
import {saveDocument, moveToLibrary} from 'app/Uploads/actions/uploadsActions';

export class DocumentForm extends Component {

  submit(e, move) {
    e.preventDefault();

    if (move) {
      return this.props.handleSubmit(this.props.moveToLibrary)();
    }

    this.props.handleSubmit(this.props.saveDocument)();
  }

  render() {
    const templateOptions = this.props.templates.map((template) => {
      return {label: template.name, value: template._id};
    });

    let fieldsTemplate = [];
    if (this.props.values.template) {
      let templateSelected = this.props.templates.find(template => template._id === this.props.values.template);
      fieldsTemplate = prepareTemplateFields(templateSelected, this.props.thesauris).properties;
    }

    return (
      <form onSubmit={(e) => this.submit(e, false)}>
        <Textarea properties={this.props.fields.title} label="Title" />
        <Select properties={this.props.fields.template} options={templateOptions} />
        <DynamicFields template={fieldsTemplate} fields={this.props.fields.metadata} />

        <button className="btn btn-sm btn-default submit">
          <i className="fa fa-floppy-o"></i>
          Save
        </button>
        {(() => {
          if (this.props.initialDoc.processed) {
            return (
              <button onClick={(e) => this.submit(e, true)} className="btn btn-sm btn-default to-library">
              <i className="fa fa-folder-open-o"></i>
              Move to library
              </button>
            );
          }
        })()}
      </form>
    );
  }

}

DocumentForm.propTypes = {
  fieldsConfig: PropTypes.array,
  templates: PropTypes.array,
  fields: PropTypes.object,
  initialDoc: PropTypes.object,
  values: PropTypes.object,
  thesauris: PropTypes.array,
  handleSubmit: PropTypes.func,
  saveDocument: PropTypes.func,
  moveToLibrary: PropTypes.func
};

export function mapStateToProps(state, props) {
  let currentTemplate = props.initialValues.template;

  if (state.form.document) {
    currentTemplate = state.form.document.template.value;
  }

  let template = props.templates.find((t) => t._id === currentTemplate);

  let metadataFields = template.properties.map((property) => {
    return 'metadata.' + property.name;
  });

  return {
    fieldsConfig: props.fieldsConfig,
    fields: ['_id', '_rev', 'title', 'template', ...metadataFields],
    template,
    initialDoc: props.initialValues
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({saveDocument, moveToLibrary}, dispatch);
}

export function validateForm(values, props) {
  let dynamicValidations = generateValidation(props.template, 'metadata.');
  return validate(values, Object.assign({
    title: {presence: true}
  }, dynamicValidations));
}

let form = reduxForm({
  form: 'document',
  validate: validateForm
},
mapStateToProps,
mapDispatchToProps
)(DocumentForm);

export default form;
