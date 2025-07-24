import React, { Component } from 'react';
import { debounce } from 'app/utils';
import { MultiSelect, MultiSelectProps, Option, defaultProps } from './MultiSelect';

interface LookupMultiSelectProps extends MultiSelectProps<string[]> {
  lookup: Function;
}

interface LookupMultiSelectState {
  preloadedOptions: Option[];
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
      preloadedOptions: props.options,
      lookupOptions: [],
      selectedOptions: [],
      totalPossibleOptions: props.totalPossibleOptions,
    };
    this.onChange = this.onChange.bind(this);
    this.onFilter = debounce(this.onFilter.bind(this), debounceTime) as (
      searchTerm: string
    ) => Promise<void>;
  }

  async componentDidMount() {
    if (this.props.lookup) {
      const { options, count } = await this.props.lookup('');
      const combinedOptions = [...this.props.options, ...options].filter(
        uniqueOptions(this.props.optionsValue)
      );
      this.setState({ preloadedOptions: combinedOptions, totalPossibleOptions: count });
    }
  }

  async componentDidUpdate(prevProps: LookupMultiSelectProps) {
    if (prevProps.lookup !== this.props.lookup) {
      const { options, count } = await this.props.lookup('');
      const combinedOptions = [...this.props.options, ...options].filter(
        uniqueOptions(this.props.optionsValue)
      );
      this.setState({ preloadedOptions: combinedOptions, totalPossibleOptions: count });
    }
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
    if (!this.props.lookup) {
      return;
    }
    const { options, count } = await this.props.lookup(searchTerm);

    const lookupOptions = options.map((o: Option) => ({
      ...o,
      [this.props.optionsValue]: o.value,
      [this.props.optionsLabel]: o.label,
    }));

    this.setState({ lookupOptions, totalPossibleOptions: count });
  }

  combineOptions(): Option[] {
    return [
      ...this.state.preloadedOptions,
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

export type { LookupMultiSelectState, LookupMultiSelectProps };
