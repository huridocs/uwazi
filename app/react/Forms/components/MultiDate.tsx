import React, { Component } from 'react';
import { Icon } from 'UI';
import { Translate } from 'app/I18N';
import { DatePicker } from 'app/V2/Components/Forms/DatePicker';

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

  onChange(index: number, value: number | null) {
    const values = this.state.values.slice();
    values[index] = value;
    this.setState({ values });
    this.props.onChange(values);
  }

  add(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    const values = this.state.values.slice();
    values.push(null);
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
              <DatePicker
                locale={this.props.locale}
                format={this.props.format}
                onChange={(val) => this.onChange(index, val)}
                value={value}
                showClearFieldIcon={false}
              />
              <button
                type="button"
                className="react-datepicker__delete-icon"
                onClick={(e) => this.remove(index, e)}
              />
            </div>
          )))()}
        <button type="button" className="btn btn-success add" onClick={(e) => this.add(e)}>
          <Icon icon="plus" />
          &nbsp;
          <Translate>Add date</Translate>
        </button>
      </div>
    );
  }
}
