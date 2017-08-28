import PropTypes from 'prop-types';
import React, {Component} from 'react';
import {Field, Control} from 'react-redux-form';
import {MultiSelect} from 'app/Forms';
import ShowIf from 'app/App/ShowIf';
import {t} from 'app/I18N';
import advancedSortUtil from 'app/utils/advancedSort';
import nestedProperties from 'app/Templates/components/ViolatedArticlesNestedProperties';
import {store} from 'app/store';

export default class NestedMultiselect extends Component {

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

  onChange(key, optionsSelected) {
    let values = Object.assign({}, this.state.values);
    values[key] = optionsSelected;
    this.setState({values});
    this.props.onChange(values);
  }

  selectAnyChange(key, e) {
    let values = Object.assign({}, this.state.values);
    values[key + 'any'] = e.target.checked;
    values[key] = [];
    this.setState({values});
    this.props.onChange(values);
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
                let options = this.getOptions(prop);
                if (!options.length) {
                  return false;
                }
                let locale = store.getState().locale;
                let label = nestedProperties[prop.toLowerCase()] ? nestedProperties[prop.toLowerCase()]['label_' + locale] : prop;
                return <li key={index}>
                        <Field model={`.filters.${property.name}.properties.${prop}.any`}>
                          <div className="multiselectItem">
                            <input
                              type='checkbox'
                              className="form-control"
                              id={prop.key}
                               className="multiselectItem-input"
                               onChange={this.selectAnyChange.bind(this, prop)}
                            />
                            <label htmlFor={prop} className="multiselectItem-label">
                              <i className="multiselectItem-icon fa fa-square-o"></i>
                              <i className="multiselectItem-icon fa fa-check"></i>
                              <span className="multiselectItem-name" title={label}><b>{label}</b></span>
                            </label>
                            <span className="multiselectItem-results">
                              <span className="multiselectItem-action" onClick={this.toggleOptions.bind(this, prop)}>
                                <i className={this.state[prop] ? 'fa fa-caret-up' : 'fa fa-caret-down'}></i>
                              </span>
                            </span>
                          </div>
                        </Field>
                        <ShowIf if={this.state[prop]}>
                          <Control.select
                            model={`.filters.${property.name}.properties.${prop}.values`}
                            prefix={property.name + prop}
                            options={options}
                            onChange={this.onChange.bind(this, prop)}
                            showAll={true}
                            hideSearch={true}
                            noSort={true}
                            filter={this.state.filter}
                            component={MultiSelect}
                          />
                        </ShowIf>
                      </li>;
              });
            })()}
          </ul>;
  }

}

NestedMultiselect.propTypes = {
  onChange: PropTypes.func,
  value: PropTypes.object,
  property: PropTypes.object,
  aggregations: PropTypes.object
};
