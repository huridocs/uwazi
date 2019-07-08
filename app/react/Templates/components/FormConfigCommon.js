import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Field } from 'react-redux-form';
import { connect } from 'react-redux';

import PrioritySortingLabel from './PrioritySortingLabel';

export class FormConfigCommon extends Component {
  render() {
    const { index } = this.props;
    const baseZeroIndex = index + this.props.data.commonProperties.length;
    const property = this.props.data.commonProperties[baseZeroIndex];

    return (
      <div>
        {property.name === 'title' && (
          <div className="form-group">
            <label htmlFor={`label${index}`}>Name</label>
            <Field model={`template.data.commonProperties[${baseZeroIndex}].label`}>
              <input id={`label${index}`} className="form-control" />
            </Field>
          </div>
        )}
        <Field model={`template.data.commonProperties[${baseZeroIndex}].prioritySorting`}>
          <input id={`prioritySorting${this.props.index}`} type="checkbox" />
          &nbsp;
          <PrioritySortingLabel htmlFor={`prioritySorting${this.props.index}`} />
        </Field>
      </div>
    );
  }
}

FormConfigCommon.propTypes = {
  data: PropTypes.object,
  index: PropTypes.number
};

export function mapStateToProps({ template }) {
  return {
    data: template.data
  };
}

export default connect(mapStateToProps)(FormConfigCommon);
