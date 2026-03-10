import DatePicker from 'app/Forms/components/DatePicker';
import React, { Component } from 'react';
import { Icon } from 'UI';
import { Translate } from 'app/I18N';

export interface MultiDateProps {
  value?: (number | null)[];
  onChange: (event: any) => void;
  locale: string;
  format: string;
}

interface MultiDateState {
  values: (number | null)[];
}

export default class MultiDate extends Component<MultiDateProps, MultiDateState> {
  constructor(props: MultiDateProps) {
    super(props);
    const values = this.props.value && this.props.value.length ? this.props.value : [null];
    this.state = { values };
  }

  onChange(index: number, value: number) {
    const values = this.state.values.slice();
    values[index] = value;
    this.setState({ values });
    this.props.onChange(values);
  }

  add(e: any) {
    e.preventDefault();
    const values = this.state.values.slice();
    values.push(null);
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
                value={value}
              />
              <button
                type="button"
                className="react-datepicker__delete-icon"
                onClick={this.remove.bind(this, index)}
              />
            </div>
          )))()}
        <button type="button" className="btn btn-success add" onClick={this.add.bind(this)}>
          <Icon icon="plus" />
          &nbsp;
          <Translate>Add date</Translate>
        </button>
      </div>
    );
  }
}
