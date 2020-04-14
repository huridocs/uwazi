import React, { Component } from 'react';
import MultiSelect, { MultiSelectProps, Option, defaultProps } from './MultiSelect';

type LookupMultiSelectProps = MultiSelectProps<string[]> & {
  lookup: Function;
};

interface LookupMultiSelectState {
  lookupOptions: Option[];
  selectedOptions: Option[];
}

const uniqueOptions = (optionsValue: string) => (option: Option, i: number, arr: Option[]) =>
  arr.findIndex(o => o[optionsValue] === option[optionsValue]) === i;

function notEmpty<TValue>(value: TValue | null | undefined): value is TValue {
  return value !== null && value !== undefined;
}

export class LookupMultiSelect extends Component<LookupMultiSelectProps, LookupMultiSelectState> {
  static defaultProps = defaultProps;

  constructor(props: LookupMultiSelectProps) {
    super(props);
    this.state = { lookupOptions: [], selectedOptions: [] };
    this.onChange = this.onChange.bind(this);
    this.onFilter = this.onFilter.bind(this);
  }

  onChange(value: string[]) {
    this.props.onChange(value);
    const options = this.combineOptions();

    const selectedOptions = value
      .map(v => options.find(o => o[this.props.optionsValue] === v))
      .filter(notEmpty);

    this.setState({ selectedOptions });
  }

  async onFilter(searchTerm: string) {
    if (searchTerm.length > 3) {
      const response = await this.props.lookup(searchTerm);

      const lookupOptions = response.map(o => ({
        [this.props.optionsValue]: o.value,
        [this.props.optionsLabel]: o.label,
        results: o.results,
      }));

      this.setState({ lookupOptions });
    }

    if (searchTerm.length <= 3) {
      this.setState({ lookupOptions: [] });
    }
  }

  combineOptions(): Option[] {
    return [
      ...this.props.options,
      ...this.state.lookupOptions,
      ...this.state.selectedOptions,
    ].filter(uniqueOptions(this.props.optionsValue));
  }

  render() {
    const { lookup, onChange, ...rest } = this.props;
    return (
      <MultiSelect
        {...rest}
        onChange={this.onChange}
        onFilter={this.onFilter}
        options={this.combineOptions()}
      />
    );
  }
}
