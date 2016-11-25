import React, {Component, PropTypes} from 'react';
import {createFieldClass, controls} from 'react-redux-form';
import {FormField, MultiSelect} from 'app/Forms';
import ShowIf from 'app/App/ShowIf';
import {t} from 'app/I18N';
import advancedSortUtil from 'app/utils/advancedSort';

export class NestedMultiselect extends Component {

  constructor(props) {
    super(props);
    let values = this.props.value || {};
    this.state = {values, filter: ''};
    if (!Object.keys(this.state.values).length) {
      this.state.values = props.property.nestedProperties.reduce((result, prop) => {
        result[prop.key] = [];
        return result;
      }, {});
    }
  }

  onChange(key, values) {
    this.state.values[key] = values;
    this.setState(this.state);
    this.props.onChange(this.state.values);
  }

  selectAnyChange(key, e) {
    this.state.values[key + 'any'] = e.target.checked;
    this.setState(this.state);
    this.props.onChange(this.state.values);
  }

  toggleOptions(key, e) {
    e.preventDefault();
    let state = {};
    state[key] = !this.state[key];
    this.setState(state);
  }

  filter(e) {
    this.setState({filter: e.target.value});
  }

  resetFilter() {
    this.setState({filter: ''});
  }

  getOptions(prop) {
    let aggregations = this.props.aggregations.toJS();
    if (!aggregations[this.props.property.name]) {
      return [];
    }
    let options = aggregations[this.props.property.name][prop].buckets.map((item) => {
      return {label: item.key, value: item.key, results: item.filtered.total.filtered.doc_count};
    }).filter((option) => option.results);
    return advancedSortUtil.advancedSort(options, {property: 'value', treatAs: 'dottedList', listTypes: [Number, Number, String]});
  }

  render() {
    let property = this.props.property;
    return <ul className="multiselect is-active">
            <li className="multiselectActions">
              <div className="form-group">
                <i className={this.state.filter ? 'fa fa-times-circle' : 'fa fa-search'} onClick={this.resetFilter.bind(this)}></i>
                <input
                  className="form-control"
                  type='text'
                  placeholder={t('System', 'Search item')}
                  value={this.state.filter}
                  onChange={this.filter.bind(this)}
                />
              </div>
            </li>
            {(() => {
              return property.nestedProperties.map((prop, index) => {
                let options = this.getOptions(prop.key);
                if (!options.length) {
                  return false;
                }
                return <li key={index}>
                        <FormField model={`search.filters.${property.name}.properties.${prop.key}.any`}>
                          <div className="multiselectItem">
                            <input
                              type='checkbox'
                              className="form-control"
                              id={prop.key}
                               className="multiselectItem-input"
                               onChange={this.selectAnyChange.bind(this, prop.key)}
                            />
                            <label htmlFor={prop.key} className="multiselectItem-label">
                              <i className="multiselectItem-icon fa fa-square-o"></i>
                              <i className="multiselectItem-icon fa fa-check"></i>
                              <span className="multiselectItem-name"><b>{prop.label}</b></span>
                            </label>
                            <span className="multiselectItem-results">
                              <span className="multiselectItem-action" onClick={this.toggleOptions.bind(this, prop.key)}>
                                <i className={this.state[prop.key] ? 'fa fa-caret-up' : 'fa fa-caret-down'}></i>
                              </span>
                            </span>
                          </div>
                        </FormField>
                        <ShowIf if={this.state[prop.key]}>
                          <FormField model={`search.filters.${property.name}.properties.${prop.key}.values`}>
                            <MultiSelect
                              prefix={property.name + prop.key}
                              options={this.getOptions(prop.key)}
                              onChange={this.onChange.bind(this, prop.key)}
                              showAll={true}
                              hideSearch={true}
                              noSort={true}
                              filter={this.state.filter}
                            />
                          </FormField>
                        </ShowIf>
                      </li>;
              });
            })()}
          </ul>;
  }

}

NestedMultiselect.propTypes = {
  onChange: PropTypes.func,
  value: PropTypes.array,
  property: PropTypes.object,
  aggregations: PropTypes.object
};

export default NestedMultiselect;

const NestedMultiselectField = createFieldClass({
  NestedMultiselect: controls.textarea
});

export {NestedMultiselectField};
