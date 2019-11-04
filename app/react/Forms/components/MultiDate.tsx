/** @format */

import React, { Component } from 'react';
import { Icon } from 'UI';
import DatePicker from './DatePicker';

export interface MultiDateProps {
  value: [{ value: number }];
  onChange: (event: any) => void;
  locale: string;
  format: string;
}

interface MultiDateState {
  values: { value: number | null }[];
}

export default class MultiDate extends Component<MultiDateProps, MultiDateState> {
  constructor(props: MultiDateProps) {
    super(props);
    const values =
      this.props.value && this.props.value.length ? this.props.value : [{ value: null }];
    this.state = { values };
  }

  onChange(index: number, value: number) {
    const values = this.state.values.slice();
    values[index] = Object.assign({}, values[index]);
    values[index].value = value;
    this.setState({ values });
    this.props.onChange(values);
  }

  add(e: any) {
    e.preventDefault();
    const values = this.state.values.slice();
    values.push({ value: null });
    this.setState({ values });
  }

  remove(index: number, e: any) {
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
              <DatePicker
                locale={this.props.locale}
                format={this.props.format}
                onChange={this.onChange.bind(this, index)}
                value={value.value}
              />
              <button
                className="react-datepicker__delete-icon"
                onClick={this.remove.bind(this, index)}
              />
            </div>
          )))()}
        <button className="btn btn-success add" onClick={this.add.bind(this)}>
          <Icon icon="plus" />
          &nbsp;
          <span>Add date</span>
        </button>
      </div>
    );
  }
}
