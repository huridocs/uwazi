import PropTypes from 'prop-types';
import React, { Component } from 'react';
import ShowIf from 'app/App/ShowIf';
import { Field, Control } from 'react-redux-form';
import { t } from 'app/I18N';
import { advancedSort } from 'app/utils/advancedSort';
import nestedProperties from 'app/Templates/components/ViolatedArticlesNestedProperties';
import { store } from 'app/store';
import { Icon } from 'UI';
import { MultiSelect } from './MultiSelect';

export default class NestedMultiselect extends Component {
  constructor(props) {
    super(props);
    const values = this.props.value || {};
    this.state = { values, filter: '' };
    if (!Object.keys(this.state.values).length) {
      this.state.values = props.property.nestedProperties.reduce((result, prop) => {
        result[prop.key] = [];
        return result;
      }, {});
    }
  }

  onChange(key, optionsSelected) {
    const values = { ...this.state.values, [key]: optionsSelected };

    this.setState({ values });
    this.props.onChange(values);
  }

  getOptions(prop, aggregations) {
    if (this.props.options) {
      return this.props.options;
    }

    if (!aggregations.all[this.props.property.name][prop]) {
      return [];
    }
    let options = aggregations.all[this.props.property.name][prop].buckets;
    if (options.length === 1 && options[0].key === 'missing') {
      return [];
    }
    options = options
      .map(item => ({
        label: item.key,
        value: item.key,
        results: item.filtered.total.filtered.doc_count,
      }))
      .filter(option => option.results);
    return advancedSort(options, {
      property: 'value',
      treatAs: 'dottedList',
      listTypes: [Number, Number, String],
    });
  }

  resetFilter() {
    this.setState({ filter: '' });
  }

  filter(e) {
    this.setState({ filter: e.target.value });
  }

  selectAnyChange(key, e) {
    const values = { ...this.state.values, [key]: [], [`${key}any`]: e.target.checked };
    this.setState({ values });
    this.props.onChange(values);
  }

  toggleOptions(key, e) {
    e.preventDefault();
    const state = {};
    state[key] = !this.state[key];
    this.setState(state);
  }

  render() {
    const { property } = this.props;
    const { locale } = store.getState();
    const aggregations = this.props.aggregations ? this.props.aggregations.toJS() : {};
    return (
      <ul className="multiselect is-active">
        <li className="multiselectActions">
          <div className="form-group">
            <Icon
              icon={this.state.filter ? 'times-circle' : 'search'}
              onClick={this.resetFilter.bind(this)}
            />
            <input
              className="form-control"
              type="text"
              placeholder={t('System', 'Search item', null, false)}
              value={this.state.filter}
              onChange={this.filter.bind(this)}
            />
          </div>
        </li>
        {(() =>
          property.nestedProperties.map((prop, index) => {
            const options = this.getOptions(prop, aggregations);
            if (!options.length) {
              return false;
            }
            const label = nestedProperties[prop.toLowerCase()]
              ? nestedProperties[prop.toLowerCase()][`label_${locale}`]
              : prop;
            return (
              <li key={index}>
                <Field model={`.filters.${property.name}.properties.${prop}.any`}>
                  <div className="multiselectItem">
                    <input
                      type="checkbox"
                      className="form-control multiselectItem-input"
                      id={prop.key}
                      onChange={this.selectAnyChange.bind(this, prop)}
                    />
                    <label htmlFor={prop} className="multiselectItem-label">
                      <span className="multiselectItem-icon" />
                      <span className="multiselectItem-name" title={label}>
                        <b>{label}</b>
                      </span>
                    </label>
                    <span className="multiselectItem-results">
                      <span
                        className="multiselectItem-action"
                        onClick={this.toggleOptions.bind(this, prop)}
                      >
                        <Icon icon={this.state[prop] ? 'caret-up' : 'caret-down'} />
                      </span>
                    </span>
                  </div>
                </Field>
                <ShowIf if={this.state[prop]}>
                  <Control
                    component={MultiSelect}
                    model={`.filters.${property.name}.properties.${prop}.values`}
                    prefix={property.name + prop}
                    options={options}
                    onChange={this.onChange.bind(this, prop)}
                    showAll
                    hideSearch
                    sortbyLabel
                    filter={this.state.filter}
                  />
                </ShowIf>
              </li>
            );
          }))()}
      </ul>
    );
  }
}

NestedMultiselect.defaultProps = {
  value: {},
  options: undefined,
};

NestedMultiselect.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.instanceOf(Object),
  property: PropTypes.instanceOf(Object).isRequired,
  options: PropTypes.instanceOf(Array),
  aggregations: PropTypes.instanceOf(Object).isRequired,
};
