import React, {Component, PropTypes} from 'react';
import {Form, Field} from 'react-redux-form';

import validator from '../helpers/validator';
import {Select as SimpleSelect} from 'app/Forms';
import MetadataFormFields from './MetadataFormFields';
import {FormGroup, IconSelector} from 'app/ReactReduxForms';
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

  //shouldComponentUpdate(nextProps) {
    //const templateChanged = !this.props.metadata.template || this.props.metadata.template !== nextProps.metadata.template;
    //const validityChanged = this.props.state.$form.valid !== nextProps.state.$form.valid;
    //const touchedChanged = this.props.state.$form.touched !== nextProps.state.$form.touched;

    //return templateChanged || validityChanged || touchedChanged;
  //}

  render() {
    let {metadata, state, templates} = this.props;
    templates = templates.filter((template) => {
      if (metadata.type === 'entity') {
        return template.get('isEntity');
      }
      return !template.get('isEntity');
    });

    let template = templates.find((tmpl) => tmpl.get('_id') === metadata.template);
    const {model} = this.props;
    if (!template) {
      return <div />;
    }

    const templateOptions = templates.map((tmpl) => {
      return {label: tmpl.get('name'), value: tmpl.get('_id')};
    });

    return (
      <Form id='metadataForm' model={model} onSubmit={this.props.onSubmit} validators={validator.generate(template.toJS())}>

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
                value={template.get('_id')}
                options={templateOptions.toJS()}
                onChange={(e) => {
                  this.props.changeTemplate(model, this.props.metadata, templates.find((tmpl) => tmpl.get('_id') === e.target.value).toJS());
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

        <MetadataFormFields thesauris={this.props.thesauris} state={state} template={template} />
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
