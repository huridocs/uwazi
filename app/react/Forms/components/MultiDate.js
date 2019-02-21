import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Icon } from 'UI';
import DatePicker from './DatePicker';

export default class MultiDate extends Component {
  constructor(props) {
    super(props);
    const values = this.props.value && this.props.value.length ? this.props.value : [null];
    this.state = { values };
  }

  onChange(index, value) {
    const values = this.state.values.slice();
    values[index] = value;
    this.setState({ values });
    this.props.onChange(values);
  }

  add(e) {
    e.preventDefault();
    const values = this.state.values.slice();
    values.push(null);
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
        {(() => this.state.values.map((value, index) => (
          <div key={index} className="multidate-item">
            <DatePicker locale={this.props.locale} format={this.props.format} onChange={this.onChange.bind(this, index)} value={value}/>
            <button className="react-datepicker__delete-icon" onClick={this.remove.bind(this, index)} />
          </div>
)))()}
        <button className="btn btn-success add" onClick={this.add.bind(this)}>
          <Icon icon="plus" />&nbsp;
          <span>Add date</span>
        </button>
      </div>
    );
  }
}

MultiDate.propTypes = {
  value: PropTypes.array,
  onChange: PropTypes.func,
  locale: PropTypes.string,
  format: PropTypes.string
};
