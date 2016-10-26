import React, {Component, PropTypes} from 'react';
import {createFieldClass, controls} from 'react-redux-form';
import {FormField, MultiSelect} from 'app/Forms';
import ShowIf from 'app/App/ShowIf';

export class NestedMultiselect extends Component {

  constructor(props) {
    super(props);
    let values = this.props.value || {};
    this.state = {values};
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

  getOptions(prop) {
    let aggregations = this.props.aggregations.toJS();
    if (!aggregations[this.props.property.name]) {
      return [];
    }
    return aggregations[this.props.property.name][prop].buckets.map((item) => {
      return {label: item.key, value: item.key, results: item.filtered.total.filtered.doc_count};
    }).filter((option) => option.results);
  }

  render() {
    let property = this.props.property;
    return <ul className="multiselect is-active">
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
                              <span>&nbsp;{prop.label}</span>
                            </label>
                            <button className="btn btn-xs btn-default multiselectItem-action" onClick={this.toggleOptions.bind(this, prop.key)}>
                              <i className={this.state[prop.key] ? 'fa fa-caret-up' : 'fa fa-caret-down'}></i>
                            </button>
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
