import { Field } from 'react-redux-form';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { orderBy } from 'lodash';

import { Select } from 'app/ReactReduxForms';
import { Translate, t } from 'app/I18N';
import { Warning } from 'app/Layout';
import PropertyConfigOptions from './PropertyConfigOptions';
import { checkErrorsOnLabel } from '../utils/checkErrorsOnLabel';

class FormConfigSelect extends Component {
  static getDerivedStateFromProps(props, state) {
    return { warning: Boolean(state.initialContent !== props.property.content) };
  }

  static contentValidation() {
    return { required: val => val.trim() !== '' };
  }

  constructor(props) {
    super(props);
    this.state = { warning: false, initialContent: props.property.content };
  }

  render() {
    const { index, type, labelHasError, contentRequiredError, templateId, property } = this.props;
    const thesauris = this.props.thesauris.toJS();

    const options = orderBy(
      thesauris
        .filter(thesaurus => thesaurus._id !== templateId && thesaurus.type !== 'template')
        .map(thesaurus => ({
          ...thesaurus,
          name: t(thesaurus._id, thesaurus.name, null, false),
        })),
      'name'
    );

    return (
      <div>
        <div className={`form-group${labelHasError ? ' has-error' : ''}`}>
          <label htmlFor="property-label">
            <Translate>Label</Translate>
          </label>
          <Field model={`template.data.properties[${index}].label`}>
            <input className="form-control" id="property-label" />
          </Field>
        </div>

        <div className="form-group">
          <label htmlFor="property-type">
            <Translate>Property type</Translate>
          </label>
          &nbsp;(<Translate>This cannot be changed after saving</Translate>)
          <Field model={`template.data.properties[${index}].type`}>
            <select
              name="type"
              id="property-type"
              className="form-control"
              disabled={!!property._id}
            >
              <option value="select">{t('System', 'property select', 'Select', false)}</option>
              <option value="multiselect">
                {t('System', 'property multiselect', 'Multiselect', false)}
              </option>
            </select>
          </Field>
        </div>

        <div className={contentRequiredError ? 'form-group has-error' : 'form-group'}>
          <label htmlFor="property-thesauri">
            <Translate>Thesauri</Translate>
            <span className="required">*</span>
          </label>
          {this.state.warning && (
            <Warning inline>
              <Translate>
                All entities and documents that have already this property assigned will loose its
                current value
              </Translate>
            </Warning>
          )}
          <Select
            model={`template.data.properties[${index}].content`}
            options={options}
            optionsLabel="name"
            optionsValue="_id"
            id="property-thesauri"
          />
        </div>

        <PropertyConfigOptions index={index} type={type} />
      </div>
    );
  }
}

FormConfigSelect.defaultProps = {
  labelHasError: false,
  contentRequiredError: false,
  templateId: '',
};

FormConfigSelect.propTypes = {
  type: PropTypes.string.isRequired,
  property: PropTypes.object.isRequired,
  thesauris: PropTypes.object,
  index: PropTypes.number,
  formKey: PropTypes.string,
  labelHasError: PropTypes.bool,
  contentRequiredError: PropTypes.bool,
  templateId: PropTypes.string,
};

export function mapStateToProps(state, props) {
  const { template, thesauris } = state;
  return {
    labelHasError: checkErrorsOnLabel(state, props),
    contentRequiredError:
      template.formState.$form.errors[`properties.${props.index}.content.required`] &&
      template.formState.$form.submitFailed,
    templateId: template.data._id,
    thesauris,
    property: template.data.properties[props.index],
  };
}

export default connect(mapStateToProps)(FormConfigSelect);
