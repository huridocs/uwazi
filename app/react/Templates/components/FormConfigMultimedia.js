import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Field } from 'react-redux-form';
import { connect } from 'react-redux';
import { Icon } from 'UI';

import { Translate } from 'app/I18N';
import { Select } from 'app/ReactReduxForms';
import Tip from 'app/Layout/Tip';

import { FilterSuggestions } from 'app/Templates/components/FilterSuggestions';
import PropertyConfigOption from './PropertyConfigOption';
import { checkErrorsOnLabel } from '../utils/checkErrorsOnLabel';

const style = index => (
  <div>
    <div className="form-group">
      <label>
        <Translate>Style</Translate>
      </label>
      <Select
        model={`template.data.properties[${index}].style`}
        options={[
          { _id: 'contain', name: 'Fit' },
          { _id: 'cover', name: 'Fill' },
        ]}
        optionsLabel="name"
        optionsValue="_id"
      />
    </div>
    <div className="protip">
      <p>
        <b>
          <Translate>Fit</Translate>
        </b>
        &nbsp;
        <Translate translationKey="Multimedia fit description">
          will show the entire media inside the container.
        </Translate>
        <br />
        <b>
          <Translate>Fill</Translate>
        </b>
        &nbsp;
        <Translate translationKey="Multimedia fill description">
          will attempt to fill the container, using its entire width. In cards, cropping is likely
          to occur.
        </Translate>
      </p>
    </div>
  </div>
);

class FormConfigMultimedia extends Component {
  render() {
    const { index, canShowInCard, helpText, canSetStyle, canBeRequired, labelHasError } =
      this.props;

    return (
      <div>
        <div className={`form-group${labelHasError ? ' has-error' : ''}`}>
          <label>
            <Translate>Name</Translate>
          </label>
          <Field model={`template.data.properties[${index}].label`}>
            <input className="form-control" />
          </Field>
        </div>

        {helpText && (
          <div className="protip">
            <Icon icon="lightbulb" />
            <span>{helpText}</span>
          </div>
        )}

        <PropertyConfigOption
          label="Hide label"
          model={`template.data.properties[${index}].noLabel`}
        >
          <Tip>
            <Translate>This property will be shown without the label.</Translate>
          </Tip>
        </PropertyConfigOption>
        <PropertyConfigOption
          label="Full width"
          model={`template.data.properties[${index}].fullWidth`}
        >
          <Tip>
            <Translate>This property will be shown using all the width available.</Translate>
          </Tip>
        </PropertyConfigOption>
        {canBeRequired && (
          <PropertyConfigOption
            label="Required property"
            model={`template.data.properties[${index}].required`}
          >
            <Tip>
              <Translate translationKey="empty property tip">
                You won&#39;t be able to save an entity if this property is empty.
              </Translate>
            </Tip>
          </PropertyConfigOption>
        )}
        {canShowInCard && (
          <PropertyConfigOption
            label="Show in cards"
            model={`template.data.properties[${index}].showInCard`}
          >
            <Tip>
              <Translate>
                This property will appear in the library cards as part of the basic info.
              </Translate>
            </Tip>
          </PropertyConfigOption>
        )}

        {canSetStyle && style(index)}
        <FilterSuggestions index={index} />
      </div>
    );
  }
}

FormConfigMultimedia.defaultProps = {
  canShowInCard: true,
  canSetStyle: true,
  canBeRequired: true,
  labelHasError: false,
  helpText: '',
};

FormConfigMultimedia.propTypes = {
  canShowInCard: PropTypes.bool,
  canSetStyle: PropTypes.bool,
  canBeRequired: PropTypes.bool,
  helpText: PropTypes.string,
  index: PropTypes.number.isRequired,
  labelHasError: PropTypes.bool,
};

export function mapStateToProps(state, props) {
  return {
    labelHasError: checkErrorsOnLabel(state, props),
  };
}

export default connect(mapStateToProps)(FormConfigMultimedia);
