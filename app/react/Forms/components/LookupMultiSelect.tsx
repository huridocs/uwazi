import React, { Component } from 'react';
import debounce from 'app/utils/debounce';
import { MultiSelect, MultiSelectProps, Option, defaultProps } from './MultiSelect';

export type LookupMultiSelectProps = MultiSelectProps<string[]> & {
  lookup: Function;
};

export interface LookupMultiSelectState {
  lookupOptions: Option[];
  selectedOptions: Option[];
  totalPossibleOptions: number;
}

const uniqueOptions = (optionsValue: string) => (option: Option, i: number, arr: Option[]) =>
  arr.findIndex(o => o[optionsValue] === option[optionsValue]) === i;

function notEmpty<TValue>(value: TValue | null | undefined): value is TValue {
  return value !== null && value !== undefined;
}

export const debounceTime = 200;

export class LookupMultiSelect extends Component<LookupMultiSelectProps, LookupMultiSelectState> {
  static defaultProps = { ...defaultProps, value: [] as string[] };

  static getDerivedStateFromProps(props: LookupMultiSelectProps) {
    return { totalPossibleOptions: props.totalPossibleOptions };
  }

  constructor(props: LookupMultiSelectProps) {
    super(props);
    this.state = {
      lookupOptions: [],
      selectedOptions: [],
      totalPossibleOptions: props.totalPossibleOptions,
    };
    this.onChange = this.onChange.bind(this);
    this.onFilter = debounce(this.onFilter.bind(this), debounceTime);
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
    if (searchTerm.length) {
      const { options, count } = await this.props.lookup(searchTerm);

      const lookupOptions = options.map((o: Option) => ({
        ...o,
        [this.props.optionsValue]: o.value,
        [this.props.optionsLabel]: o.label,
      }));

      this.setState({ lookupOptions, totalPossibleOptions: count });
    }

    if (!searchTerm.length) {
      this.setState({
        lookupOptions: [],
        totalPossibleOptions: this.props.totalPossibleOptions,
      });
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
    const { lookup, onChange, totalPossibleOptions, ...rest } = this.props;
    const filteredTotalPossibleOptions = this.state.totalPossibleOptions;
    return (
      <MultiSelect
        {...rest}
        onChange={this.onChange}
        onFilter={this.onFilter}
        totalPossibleOptions={filteredTotalPossibleOptions}
        options={this.combineOptions()}
      />
    );
  }
}
