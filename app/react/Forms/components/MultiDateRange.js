import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Icon } from 'UI';
import { Translate } from 'app/I18N';
import DatePicker from './DatePicker';

class MultiDateRange extends Component {
  constructor(props) {
    super(props);
    const values =
      this.props.value && this.props.value.length ? this.props.value : [{ from: null, to: null }];
    this.state = { values };
  }

  fromChange(index, value) {
    const values = this.state.values.slice();
    values[index] = { ...values[index] };
    values[index].from = value;
    this.setState({ values });
    this.props.onChange(values);
  }

  toChange(index, value) {
    const values = this.state.values.slice();
    values[index] = { ...values[index] };
    values[index].to = value;
    this.setState({ values });
    this.props.onChange(values);
  }

  add(e) {
    e.preventDefault();
    const values = this.state.values.slice();
    values.push({ from: null, to: null });
    this.setState({ values });
  }

  remove(index, e) {
    e.preventDefault();
    const values = this.state.values.slice();
    values.splice(index, 1);
    this.setState({ values });
    this.props.onChange(values);
  }

  render() {
    return (
      <div className="multidate">
        {(() =>
          this.state.values.map((value, index) => (
            <div key={index} className="multidate-item">
              <div className="multidate-range">
                <div className="DatePicker__From">
                  <span className="truncate">
                    <Translate translationKey='Label date "From"'>From:</Translate>
                  </span>
                  <DatePicker
                    format={this.props.format}
                    value={value.from}
                    onChange={this.fromChange.bind(this, index)}
                  />
                </div>
                <div className="DatePicker__To">
                  <span className="truncate">
                    <Translate translationKey='Label date "to"'>To:</Translate>
                  </span>
                  <DatePicker
                    format={this.props.format}
                    value={value.to}
                    endOfDay
                    onChange={this.toChange.bind(this, index)}
                  />
                </div>
                <button
                  className="react-datepicker__delete-icon"
                  onClick={this.remove.bind(this, index)}
                />
                <div className="multidate-range-clear-float"></div>
              </div>
            </div>
          )))()}
        <button className="btn btn-success add" onClick={this.add.bind(this)}>
          <Icon icon="plus" />
          &nbsp;
          <Translate>Add date</Translate>
        </button>
      </div>
    );
  }
}

MultiDateRange.propTypes = {
  value: PropTypes.array,
  onChange: PropTypes.func,
  format: PropTypes.string,
};

export default MultiDateRange;
