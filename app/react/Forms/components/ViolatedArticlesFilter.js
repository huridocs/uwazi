import React, {Component, PropTypes} from 'react';
import {createFieldClass, controls} from 'react-redux-form';
import {FormField, MultiSelect} from 'app/Forms';

export class ViolatedArticlesFilter extends Component {

  constructor(props) {
    super(props);
    this.cadhOptions = [
      {label: '1', value: '1'},
      {label: '2', value: '2'},
      {label: '3', value: '3'},
      {label: '4', value: '4'},
      {label: '5', value: '5'},
      {label: '6', value: '6'}
    ];

    this.cipstOptions = [
      {label: '1', value: '1'},
      {label: '2', value: '2'},
      {label: '3', value: '3'},
      {label: '4', value: '4'},
      {label: '5', value: '5'},
      {label: '6', value: '6'}
    ];

    this.cdbpOptions = [
      {label: '1', value: '1'},
      {label: '2', value: '2'},
      {label: '3', value: '3'},
      {label: '4', value: '4'},
      {label: '5', value: '5'},
      {label: '6', value: '6'}
    ];

    this.cidfpOptions = [
      {label: '1', value: '1'},
      {label: '2', value: '2'},
      {label: '3', value: '3'},
      {label: '4', value: '4'},
      {label: '5', value: '5'},
      {label: '6', value: '6'}
    ];

    this.state = {cadh: [], cipst: [], cbdp: [], cidfp: []};
  }

  onChange(key, values) {
    this.state[key] = values;
    this.setState(this.state);
    this.props.onChange(this.state);
  }

  render() {
    let property = this.props.property;
    let aggregations = this.props.aggregations.toJS();
    console.log(aggregations);
    return <div>
            <input
              type='checkbox'
              className="multiselectItem-input"
              id='cadh'
            />
            <label htmlFor='cadh'>
                <i className="multiselectItem-icon fa fa-square"></i>
                <i className="multiselectItem-icon fa fa-check-square"></i>
                <span>CADH</span>
            </label>
            <FormField model={`search.filters.${property.name}.cadh`}>
              <MultiSelect optionsToShow={0} options={this.cadhOptions} onChange={this.onChange.bind(this, 'cadh')} value={this.state.cadh}/>
            </FormField>

            <input
              type='checkbox'
              className="multiselectItem-input"
              id='cipst'
            />
            <label htmlFor='cipst'>
                <i className="multiselectItem-icon fa fa-square"></i>
                <i className="multiselectItem-icon fa fa-check-square"></i>
                <span>CIPST</span>
            </label>
            <FormField model={`search.filters.${property.name}.cipst`}>
              <MultiSelect optionsToShow={0} options={this.cipstOptions} onChange={this.onChange.bind(this, 'cipst')} value={this.state.cipst}/>
            </FormField>

            <input
              type='checkbox'
              className="multiselectItem-input"
              id='cbdp'
            />
            <label htmlFor='cbdp'>
                <i className="multiselectItem-icon fa fa-square"></i>
                <i className="multiselectItem-icon fa fa-check-square"></i>
                <span>CBDP</span>
            </label>
            <FormField model={`search.filters.${property.name}.cbdp`}>
              <MultiSelect optionsToShow={0} options={this.cdbpOptions} onChange={this.onChange.bind(this, 'cbdp')} value={this.state.cbdp}/>
            </FormField>

            <input
              type='checkbox'
              className="multiselectItem-input"
              id='cidfp'
            />
            <label htmlFor='cidfp'>
                <i className="multiselectItem-icon fa fa-square"></i>
                <i className="multiselectItem-icon fa fa-check-square"></i>
                <span>CIDFP</span>
            </label>
            <FormField model={`search.filters.${property.name}.cidfp`}>
              <MultiSelect optionsToShow={0} options={this.cidfpOptions} onChange={this.onChange.bind(this, 'cidfp')} value={this.state.cidfp}/>
            </FormField>
          </div>;
  }

}

ViolatedArticlesFilter.propTypes = {
  onChange: PropTypes.func,
  value: PropTypes.array,
  property: PropTypes.object,
  aggregations: PropTypes.object
};

export default ViolatedArticlesFilter;

const ViolatedArticlesFilterField = createFieldClass({
  ViolatedArticlesFilter: controls.textarea
});

export {ViolatedArticlesFilterField};
