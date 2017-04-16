import PropTypes from 'prop-types';
import React, {Component} from 'react';
import {connect} from 'react-redux';
import {Form, Field} from 'react-redux-form';

import validator from '../helpers/validator';
import {Select as SimpleSelect} from 'app/Forms';
import MetadataFormFields from './MetadataFormFields';
import {FormGroup, IconSelector} from 'app/ReactReduxForms';
import {createSelector} from 'reselect';
import t from 'app/I18N/t';

const selectTemplateOptions = createSelector(
  [s => s.templates, (s, isEntity) => isEntity],
  (templates, isEntity) => {
    return templates.filter(template => {
      if (isEntity) {
        return template.get('isEntity');
      }
      return !template.get('isEntity');
    })
    .map((tmpl) => {
      return {label: tmpl.get('name'), value: tmpl.get('_id')};
    });
  }
);

export class MetadataForm extends Component {
  render() {
    const {model, template, templateOptions} = this.props;
    if (!template) {
      return <div />;
    }

    return (
      <Form id='metadataForm' model={model} onSubmit={this.props.onSubmit} validators={validator.generate(template.toJS())}>

        <FormGroup model={model} field={'title'}>
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
                  this.props.changeTemplate(model, e.target.value);
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

        <MetadataFormFields thesauris={this.props.thesauris} model={model} template={template} />
      </Form>
    );
  }
}

MetadataForm.propTypes = {
  model: PropTypes.string.isRequired,
  template: PropTypes.object,
  templateOptions: PropTypes.object,
  thesauris: PropTypes.object,
  changeTemplate: PropTypes.func,
  onSubmit: PropTypes.func
};

export const mapStateToProps = (state, ownProps) => {
  return {
    template: state.templates.find(tmpl => tmpl.get('_id') === ownProps.templateId),
    templateOptions: selectTemplateOptions(state, ownProps.isEntity)
  };
};

export default connect(mapStateToProps)(MetadataForm);
