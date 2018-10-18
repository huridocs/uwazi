import { Form, Field } from 'react-redux-form';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import { FormGroup } from 'app/ReactReduxForms';
import { Select as SimpleSelect } from 'app/Forms';
import { filterBaseProperties } from 'app/Entities/utils/filterBaseProperties';
import { notify } from 'app/Notifications';
import t from 'app/I18N/t';

import IconField from './IconField';
import MetadataFormFields from './MetadataFormFields';
import validator from '../helpers/validator';

const selectTemplateOptions = createSelector(
  [s => s.templates, (s, isEntity) => isEntity],
  (templates, isEntity) => templates.filter((template) => {
    if (isEntity) {
      return template.get('isEntity');
    }
    return !template.get('isEntity');
  })
  .map(tmpl => ({ label: tmpl.get('name'), value: tmpl.get('_id') }))
);

export class MetadataForm extends Component {
  constructor(props) {
    super(props);
    this.onSubmit = this.onSubmit.bind(this);
    this.onSubmitFailed = this.onSubmitFailed.bind(this);
  }

  onSubmit(metadata) {
    this.props.onSubmit(filterBaseProperties(metadata), this.props.model);
  }

  onSubmitFailed() {
    this.props.notify(t('System', 'Invalid form', null, false), 'danger');
  }

  render() {
    const { model, template, templateOptions } = this.props;

    if (!template) {
      return <div />;
    }

    return (
      <Form
        id="metadataForm"
        model={model}
        onSubmit={this.onSubmit}
        validators={validator.generate(template.toJS())}
        onSubmitFailed={this.onSubmitFailed}
      >

        <FormGroup model=".title">
          <ul className="search__filter">
            <li><label>{t('System', 'Title')} <span className="required">*</span></label></li>
            <li className="wide">
              <Field model=".title">
                <textarea className="form-control"/>
              </Field>
            </li>
            <IconField model={model}/>
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
              />
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
  onSubmit: PropTypes.func,
  notify: PropTypes.func,
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ notify }, dispatch);
}

export const mapStateToProps = (state, ownProps) => ({
  template: state.templates.find(tmpl => tmpl.get('_id') === ownProps.templateId),
  templateOptions: selectTemplateOptions(state, ownProps.isEntity)
});

export default connect(mapStateToProps, mapDispatchToProps)(MetadataForm);
