import React, {Component, PropTypes} from 'react';
import {Form, Field} from 'react-redux-form';

import validator from '../helpers/validator';
import {Select as SimpleSelect} from 'app/Forms';
import {FormGroup, Select, MultiSelect, MarkDown, DatePicker, Nested, MultiDate, MultiDateRange, IconSelector} from 'app/ReactReduxForms';
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
    const validityChanged = this.props.state.$form.valid !== nextProps.state.$form.valid;
    const touchedChanged = this.props.state.$form.touched !== nextProps.state.$form.touched;

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

        <FormGroup {...state.title}>
          <ul className="search__filter">
            <li><label>{t('System', 'Title')} <span className="required">*</span></label></li>
            <li className="wide">
              <Field model={'.title'}>
                <textarea className="form-control"/>
              </Field>
            </li>
          </ul>
        </FormGroup>

        <FormGroup>
          <ul className="search__filter">
            <li><label>{t('System', 'Type')} <span className="required">*</span></label></li>
            <li className="wide">
              <SimpleSelect
                className="form-control"
                value={template._id}
                options={templateOptions}
                onChange={(e) => {
                  this.props.changeTemplate(model, this.props.metadata, templates.find((tmpl) => tmpl._id === e.target.value));
                }}
              >
              </SimpleSelect>
            </li>
          </ul>
        </FormGroup>

        <FormGroup>
          <ul className="search__filter">
            <li><label>{t('System', 'Icon')} / {t('System', 'Flag')}</label></li>
            <li className="wide">
              <IconSelector model={'.icon'}/>
            </li>
          </ul>
        </FormGroup>

        {template.properties.map((property) => {
          const getField = (propertyType, _model) => {
            let thesauri;
            switch (propertyType) {
            case 'select':
              thesauri = thesauris.find((opt) => opt._id.toString() === property.content.toString());
              return <Select model={_model} optionsValue='id' options={this.translateOptions(thesauri)}/>;
            case 'multiselect':
              thesauri = thesauris.find((opt) => opt._id.toString() === property.content.toString());
              return <MultiSelect model={_model} optionsValue='id' options={this.translateOptions(thesauri)} />;
            case 'date':
              return <DatePicker model={_model}/>;
            case 'markdown':
              return <MarkDown model={_model}/>;
            case 'nested':
              return <Nested model={_model}/>;
            case 'multidate':
              return <MultiDate model={_model}/>;
            case 'multidaterange':
              return <MultiDateRange model={_model}/>;
            default:
              return <Field model={_model}><input className="form-control"/></Field>;
            }
          };

          return (
            <FormGroup key={property.name} {...state.metadata[`${property.name}`]} submitFailed={state.submitFailed}>
              <ul className="search__filter is-active">
                <li>
                  <label>
                    {t(template._id, property.label)}
                    {property.required ? <span className="required">*</span> : ''}
                  </label>
                </li>
                <li className="wide">{getField(property.type, `.metadata.${property.name}`)}</li>
              </ul>
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
