/** @format */
import autobind from 'autobind-decorator';
import React, { Component } from 'react';
import { Icon } from 'UI';
import { MetadataObject } from '../../../api/entities/entitiesModel';
import DatePicker from './DatePicker';

export interface MultiDateProps {
  value: MetadataObject<number>[];
  onChange: (event: any) => void;
  locale: string;
  format: string;
}

interface MultiDateState {
  values: MetadataObject<number>[];
}

export default class MultiDate extends Component<MultiDateProps, MultiDateState> {
  constructor(props: MultiDateProps) {
    super(props);
    const values =
      this.props.value && this.props.value.length ? this.props.value : [{ value: null }];
    this.state = { values };
  }

  @autobind
  onChange(index: number, value: number) {
    this.setState(prevState => {
      const values = prevState.values.slice();
      values[index] = Object.assign({}, values[index], { value });
      return { values };
    });
    this.props.onChange(this.state.values);
  }

  @autobind
  add(e: any) {
    e.preventDefault();
    this.setState(prevState => {
      const values = prevState.values.slice();
      values.push({ value: null });
      return { values };
    });
  }

  @autobind
  remove(index: number, e: any) {
    e.preventDefault();
    this.setState(prevState => {
      const values = prevState.values.slice();
      values.splice(index, 1);
      return { values };
    });
    this.props.onChange(this.state.values);
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
        <button className="btn btn-success add" onClick={this.add}>
          <Icon icon="plus" />
          &nbsp;
          <span>Add date</span>
        </button>
      </div>
    );
  }
}
