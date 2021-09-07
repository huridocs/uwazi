import { Field } from 'react-redux-form';
import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Translate } from 'app/I18N';
import { NestedMultiselect } from 'app/ReactReduxForms';

class NestedFilter extends Component {
  render() {
    const { onChange, model, label, property, aggregations } = this.props;
    return (
      <ul className="search__filter is-active">
        <li>
          <label>{label}</label>
          <div className="nested-strict">
            <Field model={`${model}.strict`}>
              <input id={`${model}strict`} type="checkbox" onChange={onChange} />
            </Field>
            <label htmlFor={`${model}strict`}>
              <span>
                &nbsp;<Translate>Strict mode</Translate>
              </span>
            </label>
          </div>
        </li>
        <li className="wide">
          <NestedMultiselect aggregations={aggregations} property={property} onChange={onChange} />
        </li>
      </ul>
    );
  }
}

NestedFilter.defaultProps = {
  onChange: () => {},
  label: '',
  aggregations: Immutable.Map(),
};

NestedFilter.propTypes = {
  model: PropTypes.string.isRequired,
  onChange: PropTypes.func,
  property: PropTypes.object.isRequired,
  aggregations: PropTypes.instanceOf(Immutable.Map),
  label: PropTypes.oneOfType([PropTypes.node, PropTypes.string]),
};

export default NestedFilter;
