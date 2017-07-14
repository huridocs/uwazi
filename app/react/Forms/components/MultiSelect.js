import PropTypes from 'prop-types';
import React, {Component} from 'react';
import {remove as removeAccents} from 'diacritics';

import ShowIf from 'app/App/ShowIf';
import {Icon} from 'app/Layout/Icon';
import {t} from 'app/I18N';

export default class MultiSelect extends Component {

  constructor(props) {
    super(props);
    this.state = {filter: props.filter || '', showAll: props.showAll};
    this.optionsToShow = typeof props.optionsToShow !== 'undefined' ? props.optionsToShow : 5;
  }

  change(value) {
    let newValues = this.props.value ? this.props.value.slice(0) : [];
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

  componentWillReceiveProps(props) {
    if (props.filter) {
      this.setState({filter: props.filter});
    }
  }

  filter(e) {
    this.setState({filter: e.target.value});
  }

  resetFilter() {
    this.setState({filter: ''});
  }

  showAll(e) {
    e.preventDefault();
    let showAll = !this.state.showAll;
    this.setState({showAll: showAll});
  }

  sort(options, optionsValue, optionsLabel) {
    return options.sort((a, b) => {
      let sorting = 0;
      if (!this.state.showAll) {
        sorting = this.checked(b[optionsValue]) - this.checked(a[optionsValue]);
      }

      if (sorting === 0 && typeof options[0].results !== 'undefined') {
        sorting = a.results > b.results ? -1 : 1;
      }

      if (sorting === 0) {
        sorting = a[optionsLabel] < b[optionsLabel] ? -1 : 1;
      }

      return sorting;
    });
  }

  render() {
    let {optionsValue, optionsLabel, prefix} = this.props;
    optionsValue = optionsValue || 'value';
    optionsLabel = optionsLabel || 'label';
    prefix = prefix || '';

    let options = this.props.options.slice();

    if (this.state.filter) {
      options = options.filter((opt) => {
        return removeAccents(opt[optionsLabel].toLowerCase())
        .indexOf(removeAccents(this.state.filter.toLowerCase())) >= 0;
      });
    }

    let tooManyOptions = !this.state.showAll && options.length > this.optionsToShow;

    if (!this.props.noSort) {
      options = this.sort(options, optionsValue, optionsLabel);
    }

    if (tooManyOptions) {
      let numberOfActiveOptions = options.filter((opt) => this.checked(opt[optionsValue])).length;
      let optionsToShow = this.optionsToShow > numberOfActiveOptions ? this.optionsToShow : numberOfActiveOptions;
      options = options.slice(0, optionsToShow);
    }

    return (
      <ul className="multiselect is-active">
      <li className="multiselectActions">
        <ShowIf if={this.props.options.length > this.optionsToShow && !this.props.hideSearch}>
          <div className="form-group">
            <i className={this.state.filter ? 'fa fa-times-circle' : 'fa fa-search'} onClick={this.resetFilter.bind(this)}></i>
            <input
              className="form-control"
              type='text' placeholder={t('System', 'Search item')}
              value={this.state.filter}
              onChange={this.filter.bind(this)}
            />
          </div>
        </ShowIf>
      </li>
        {options.map((option, index) => {
          return <li className="multiselectItem" key={index} title={option[optionsLabel]}>
            <input
              type='checkbox'
              className="multiselectItem-input"
              value={option[optionsValue]}
              id={prefix + option[optionsValue]}
              onChange={this.change.bind(this, option[optionsValue])}
              checked={this.checked(option[optionsValue])}
            />
            <label
              className="multiselectItem-label"
              htmlFor={prefix + option[optionsValue]}>
                <i className="multiselectItem-icon fa fa-square-o"></i>
                <i className="multiselectItem-icon fa fa-check"></i>
                <span className="multiselectItem-name">
                  <Icon className="item-icon" data={option.icon}/>
                  {option[optionsLabel]}
                </span>
                <ShowIf if={typeof option.results !== 'undefined'}>
                  <span className="multiselectItem-results">{option.results}
                  </span>
                </ShowIf>
            </label>
          </li>;
        })}

        <li className="multiselectActions">
          <ShowIf if={this.props.options.length > this.optionsToShow && !this.props.showAll}>
            <button onClick={this.showAll.bind(this)} className="btn btn-xs btn-default">
              <i className={this.state.showAll ? 'fa fa-caret-up' : 'fa fa-caret-down'}></i>
              <span>{this.state.showAll ? t('System', 'x less') : this.props.options.length - this.optionsToShow + t('System', 'x more')}</span>
            </button>
          </ShowIf>
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
  optionsLabel: PropTypes.string,
  filter: PropTypes.string,
  prefix: PropTypes.string,
  optionsToShow: PropTypes.number,
  showAll: PropTypes.bool,
  hideSearch: PropTypes.bool,
  noSort: PropTypes.bool
};
