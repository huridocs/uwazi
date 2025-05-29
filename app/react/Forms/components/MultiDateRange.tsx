import React, { Component } from 'react';
import { Icon } from 'UI';
import { Translate } from 'app/I18N';
import { DatePicker } from 'V2/Components/Forms/DatePicker';

interface DateRangeValue {
  from: number | null;
  to: number | null;
}

interface MultiDateRangeProps {
  value?: DateRangeValue[];
  onChange: (values: DateRangeValue[]) => void;
  format: string;
}

interface MultiDateRangeState {
  values: DateRangeValue[];
}

class MultiDateRange extends Component<MultiDateRangeProps, MultiDateRangeState> {
  constructor(props: MultiDateRangeProps) {
    super(props);
    const values =
      this.props.value && this.props.value.length ? this.props.value : [{ from: null, to: null }];
    this.state = { values };
  }

  fromChange(index: number, value: number | null) {
    const values = this.state.values.slice();
    values[index] = { ...values[index] };
    values[index].from = value;
    this.setState({ values });
    this.props.onChange(values);
  }

  toChange(index: number, value: number | null) {
    const values = this.state.values.slice();
    values[index] = { ...values[index] };
    values[index].to = value;
    this.setState({ values });
    this.props.onChange(values);
  }

  add(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    const values = this.state.values.slice();
    values.push({ from: null, to: null });
    this.setState({ values });
  }

  remove(index: number, e: React.MouseEvent<HTMLButtonElement>) {
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
                    onChange={val => this.fromChange(index, val)}
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
                    onChange={val => this.toChange(index, val)}
                  />
                </div>
                <button
                  className="react-datepicker__delete-icon"
                  onClick={e => this.remove(index, e)}
                />
                <div className="multidate-range-clear-float"></div>
              </div>
            </div>
          )))()}
        <button className="btn btn-success add" onClick={e => this.add(e)}>
          <Icon icon="plus" />
          &nbsp;
          <Translate>Add date</Translate>
        </button>
      </div>
    );
  }
}

export default MultiDateRange;
