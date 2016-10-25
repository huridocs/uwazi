import React, {Component, PropTypes} from 'react';
import {Form} from 'react-redux-form';

import validator from '../helpers/validator';
import {FormGroup, FormField, Select, MultiSelect, MarkDown, DatePicker, Nested, MultiDate, MultiDateRange, IconSelector} from 'app/Forms';
import t from 'app/I18N/t';

export class MetadataForm extends Component {

  onSubmit(entity) {
    this.props.onSubmit(entity);
  }

  translateOptions(thesauri) {
    return thesauri.values.map((option) => {
      option.label = t(thesauri._id, option.label);
      return option;
    });
  }

  shouldComponentUpdate(nextProps) {
    const templateChanged = !this.props.metadata.template || this.props.metadata.template !== nextProps.metadata.template;
    const validityChanged = this.props.state.valid !== nextProps.state.valid;
    const touchedChanged = this.props.state.touched !== nextProps.state.touched;

    return templateChanged || validityChanged || touchedChanged;
  }

  render() {
    let {metadata, state} = this.props;
    let templates = this.props.templates.toJS();

    templates = templates.filter((template) => {
      if (metadata.type === 'entity') {
        return template.isEntity;
      }
      return !template.isEntity;
    });

    let thesauris = this.props.thesauris.toJS();
    let template = templates.find((tmpl) => tmpl._id === metadata.template);
    const {model} = this.props;
    if (!template) {
      return <div />;
    }

    const templateOptions = templates.map((tmpl) => {
      return {label: tmpl.name, value: tmpl._id};
    });

    return (
      <Form id='metadataForm' model={model} onSubmit={this.props.onSubmit} validators={validator.generate(template)}>

        <FormGroup {...state.fields.title} update={true}>
          <label>{t('System', 'Title')} <span className="required">*</span></label>
          <FormField model={`${model}.title`}>
            <textarea className="form-control"/>
          </FormField>
        </FormGroup>

        <FormGroup update={true}>
          <label>{t('System', 'Type')} <span className="required">*</span></label>
          <FormField>
            <Select options={templateOptions}
              value={template._id}
              onChange={(e) => {
                this.props.changeTemplate(model, metadata, templates.find((tmpl) => tmpl._id === e.target.value));
              }}
            />
          </FormField>
        </FormGroup>

        <FormGroup>
          <label>{t('System', 'Icon')} / {t('System', 'Flag')}</label>
          <FormField model={`${model}.icon`}>
            <IconSelector/>
          </FormField>
        </FormGroup>

        {template.properties.map((property, index) => {
          const getField = (propertyType) => {
            let thesauri;
            switch (propertyType) {
            case 'select':
              thesauri = thesauris.find((opt) => opt._id.toString() === property.content.toString());
              return <Select optionsValue='id' options={this.translateOptions(thesauri)}/>;
            case 'multiselect':
              thesauri = thesauris.find((opt) => opt._id.toString() === property.content.toString());
              return <MultiSelect optionsValue='id' options={this.translateOptions(thesauri)} />;
            case 'date':
              return <DatePicker/>;
            case 'markdown':
              return <MarkDown/>;
            case 'nested':
              return <Nested/>;
            case 'multidate':
              return <MultiDate/>;
            case 'multidaterange':
              return <MultiDateRange/>;
            default:
              return <input className="form-control"/>;
            }
          };

          return (
            <FormGroup key={index} {...state.fields[`metadata.${property.name}`]} submitFailed={state.submitFailed}>
              <label>
                {t(template._id, property.label)}
                {property.required ? <span className="required">*</span> : ''}
              </label>
              <FormField model={`${model}.metadata.${property.name}`} >
                {getField(property.type)}
              </FormField>
            </FormGroup>
            );
        })}
      </Form>
    );
  }
}

MetadataForm.propTypes = {
  metadata: PropTypes.object,
  model: PropTypes.string.isRequired,
  state: PropTypes.object,
  templates: PropTypes.object,
  thesauris: PropTypes.object,
  changeTemplate: PropTypes.func,
  onSubmit: PropTypes.func
};

export default MetadataForm;
