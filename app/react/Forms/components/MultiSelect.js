import React, {Component, PropTypes} from 'react';
import {createFieldClass, controls} from 'react-redux-form';
import ShowIf from 'app/App/ShowIf';

export class MultiSelect extends Component {

  constructor(props) {
    super(props);
    this.state = {filter: '', showAll: false};
    this.optionsToShow = 4;
  }

  change(value) {
    let newValues = this.props.value.slice(0);
    if (newValues.includes(value)) {
      newValues = newValues.filter((val) => val !== value);
      return this.props.onChange(newValues);
    }

    newValues.push(value);
    this.props.onChange(newValues);
  }

  checked(value) {
    if (!this.props.value) {
      return false;
    }
    return this.props.value.includes(value);
  }

  filter(e) {
    this.setState({filter: e.target.value});
  }

  showAll(e) {
    e.preventDefault();
    let showAll = !this.state.showAll;
    this.setState({showAll: showAll});
  }

  render() {
    let {options, optionsValue, optionsLabel} = this.props;
    optionsValue = optionsValue || 'value';
    optionsLabel = optionsLabel || 'label';
    let filteredOptions = options = options.filter((opt) => opt[optionsLabel].toLowerCase().indexOf(this.state.filter.toLowerCase()) >= 0);
    if (!this.state.showAll) {
      options = options.slice(0, this.optionsToShow);
    }

    return (
      <ul className="multiselect">
        {options.map((option, index) => {
          return <li className="multiselectItem" key={index}>
            <input
              type='checkbox'
              className="multiselectItem-input"
              value={option[optionsValue]}
              id={option[optionsValue]}
              onChange={this.change.bind(this, option[optionsValue])}
              checked={this.checked(option[optionsValue])}
            />
            <label
              className="multiselectItem-label"
              htmlFor={option[optionsValue]}>
                <i className="multiselectItem-icon fa fa-square"></i>
                <i className="multiselectItem-icon fa fa-check-square"></i>
                <span>{option[optionsLabel]}</span>
            </label>
          </li>;
        })}

        <li className="multiselectActions">
          <ShowIf if={filteredOptions.length > this.optionsToShow}>
            <button onClick={this.showAll.bind(this)} className="btn btn-xs btn-default">
              <i className={this.state.showAll ? 'fa fa-caret-up' : 'fa fa-caret-down'}></i>
              <span>{this.state.showAll ? 'Show less' : 'Show all'}</span>
            </button>
          </ShowIf>
          <div className="form-group">
            <i className="fa fa-search"></i>
            <input className="form-control" type='text' placeholder="Search item" value={this.state.filter} onChange={this.filter.bind(this)}/>
          </div>
        </li>
      </ul>
    );
  }

}

MultiSelect.propTypes = {
  onChange: PropTypes.func,
  label: PropTypes.string,
  options: PropTypes.array,
  value: PropTypes.array,
  placeholder: PropTypes.string,
  optionsValue: PropTypes.string,
  optionsLabel: PropTypes.string
};

export default MultiSelect;

const MultiSelectField = createFieldClass({
  MultiSelect: controls.select
});

export {MultiSelectField};
