import ShowIf from 'app/App/ShowIf';
import { t } from 'app/I18N';
import { Icon as CustomIcon } from 'app/Layout/Icon';
import React, { Component } from 'react';
import { Icon } from 'UI';
import { filterOptions } from '../utils/optionsUtils';

type Option = { options?: Option[]; results?: number } & { [k: string]: string };

const defaultProps = {
  optionsLabel: 'label',
  optionsValue: 'value',
  value: [] as string[],
  prefix: '',
  options: [] as Option[],
  filter: '',
  optionsToShow: 5,
  showAll: false,
  hideSearch: false,
  sort: false,
  sortbyLabel: false,
  forceHoist: false,
  placeholder: '',
  onChange: (_v: string[]) => {},
};

export type MultiSelectProps = typeof defaultProps;

interface MultiSelectState {
  filter: string;
  showAll: boolean;
  ui: { [k: string]: boolean };
}

const isNotAnEmptyGroup = (option: Option) => !option.options || option.options.length;

export default class MultiSelect extends Component<MultiSelectProps, MultiSelectState> {
  static defaultProps = defaultProps;

  constructor(props: MultiSelectProps) {
    super(props);
    this.state = { filter: props.filter, showAll: props.showAll, ui: {} };
    this.filter = this.filter.bind(this);
    this.resetFilter = this.resetFilter.bind(this);
    this.showAll = this.showAll.bind(this);
  }

  componentWillReceiveProps(props: MultiSelectProps) {
    if (props.filter) {
      this.setState({ filter: props.filter });
    }
  }

  changeGroup(group: Option, e: React.ChangeEvent<HTMLInputElement>) {
    const selectedItems = this.props.value.slice(0);
    if (e.target.checked) {
      group.options!.forEach(_item => {
        if (!this.checked(_item)) {
          selectedItems.push(_item[this.props.optionsValue]);
        }
      });
    }

    if (!e.target.checked) {
      group.options!.forEach(_item => {
        if (this.checked(_item)) {
          const index = selectedItems.indexOf(_item[this.props.optionsValue]);
          selectedItems.splice(index, 1);
        }
      });
    }
    this.props.onChange(selectedItems);
  }

  checked(option: Option) {
    if (!this.props.value) {
      return false;
    }

    if (option.options) {
      return option.options.reduce(
        (allIncluded, _option) =>
          allIncluded && this.props.value.includes(_option[this.props.optionsValue]),
        true
      );
    }
    return this.props.value.includes(option[this.props.optionsValue]);
  }

  anyChildChecked(parent: Option) {
    return Boolean(parent.options && !!parent.options.find(itm => this.checked(itm)));
  }

  change(value: string) {
    let newValues = this.props.value ? this.props.value.slice(0) : [];
    if (newValues.includes(value)) {
      newValues = newValues.filter(val => val !== value);
      this.props.onChange(newValues);
      return;
    }

    newValues.push(value);
    this.props.onChange(newValues);
  }

  filter(e: React.ChangeEvent<HTMLInputElement>) {
    this.setState({ filter: e.target.value });
  }

  resetFilter() {
    this.setState({ filter: '' });
  }

  showAll(e: React.MouseEvent) {
    e.preventDefault();
    this.setState(prevState => ({ showAll: !prevState.showAll }));
  }

  sort(options: Option[], _optionsValue: string, optionsLabel: string, isSubGroup = false) {
    const sortedOptions = options.sort((a, b) => {
      let sorting = 0;
      if (!this.state.showAll) {
        sorting =
          (this.checked(b) || this.anyChildChecked(b) ? 1 : 0) -
          (this.checked(a) || this.anyChildChecked(a) ? 1 : 0);
      }

      if (sorting === 0 && typeof options[0].results !== 'undefined' && a.results !== b.results) {
        sorting = (a.results || 0) > (b.results || 0) ? -1 : 1;
      }

      const showingAll = this.state.showAll || options.length < this.props.optionsToShow;
      if (sorting === 0 || showingAll || this.props.sortbyLabel || isSubGroup) {
        sorting = a[optionsLabel] < b[optionsLabel] ? -1 : 1;
      }

      return sorting;
    });

    return this.moveNoValueOptionToBottom(sortedOptions);
  }

  sortOnlyAggregates(options: Option[], _optionsvalue: string, optionsLabel: string) {
    if (!options.length || typeof options[0].results === 'undefined') {
      return options;
    }
    const sortedOptions = options.sort((a, b) => {
      let sorting = (b.results || 0) - (a.results || 0);

      if (sorting === 0) {
        sorting = a[optionsLabel] < b[optionsLabel] ? -1 : 1;
      }

      return sorting;
    });
    return this.moveNoValueOptionToBottom(sortedOptions);
  }

  moveNoValueOptionToBottom(options: Option[]) {
    let _options = [...options];
    ['any', 'missing'].forEach(bottomId => {
      const bottomOption = _options.find(opt => opt.id === bottomId);
      if (bottomOption && !this.checked(bottomOption)) {
        _options = _options.filter(opt => opt.id !== bottomId);
        _options.push(bottomOption);
      }
    });
    return _options;
  }

  hoistCheckedOptions(options: Option[]) {
    const [checkedOptions, otherOptions] = options.reduce(
      ([checked, others], option) => {
        if (this.checked(option) || this.anyChildChecked(option)) {
          return [checked.concat([option]), others];
        }
        return [checked, others.concat([option])];
      },
      [[] as Option[], [] as Option[]]
    );
    const partitionedOptions = checkedOptions.concat(otherOptions);
    return this.moveNoValueOptionToBottom(partitionedOptions);
  }

  moreLessLabel(totalOptions: Option[]) {
    if (this.state.showAll) {
      return t('System', 'x less');
    }
    return (
      <span>
        {totalOptions.length - this.props.optionsToShow} {t('System', 'x more')}
      </span>
    );
  }

  toggleOptions(group: Option, e: React.MouseEvent) {
    e.preventDefault();
    const groupKey = group[this.props.optionsValue];
    const { ui } = this.state;
    ui[groupKey] = !ui[groupKey];
    this.setState({ ui });
  }

  showSubOptions(parent: Option) {
    const toggled = this.state.ui[parent.id];
    const parentChecked = this.checked(parent);
    const childChecked = !!parent.options!.find(itm => this.checked(itm));
    return toggled || (!parentChecked && childChecked);
  }

  label(option: Option) {
    const { optionsValue, optionsLabel, prefix } = this.props;
    return (
      <label className="multiselectItem-label" htmlFor={prefix + option[optionsValue]}>
        <span className="multiselectItem-icon">
          <Icon icon={['far', 'square']} className="checkbox-empty" />
          <Icon icon="check" className="checkbox-checked" />
        </span>
        <span className="multiselectItem-name">
          <CustomIcon className="item-icon" data={option.icon} />
          {option[optionsLabel]}
        </span>
        <span className="multiselectItem-results">
          {option.results && <span>{option.results}</span>}
          {option.options && (
            <span
              className="multiselectItem-action"
              onClick={this.toggleOptions.bind(this, option)}
            >
              <Icon icon={this.state.ui[option.id] ? 'caret-up' : 'caret-down'} />
            </span>
          )}
        </span>
      </label>
    );
  }

  renderGroup(group: Option, index: number) {
    const { prefix } = this.props;
    const _group = Object.assign({}, group, { results: group.results });
    return (
      <li key={index} className="multiselect-group">
        <div className="multiselectItem">
          <input
            type="checkbox"
            className="group-checkbox multiselectItem-input"
            id={prefix + group.id}
            onChange={this.changeGroup.bind(this, group)}
            checked={this.checked(group)}
          />
          {this.label(_group)}
        </div>
        <ShowIf if={this.showSubOptions(group)}>
          <ul className="multiselectChild is-active">
            {group.options!.map((_item, i) => this.renderOption(_item, i, index.toString()))}
          </ul>
        </ShowIf>
      </li>
    );
  }

  renderOption(option: Option, index: number, groupIndex = '') {
    const { optionsValue, optionsLabel, prefix } = this.props;
    const key = `${groupIndex}${index}`;
    return (
      <li className="multiselectItem" key={key} title={option[optionsLabel]}>
        <input
          type="checkbox"
          className="multiselectItem-input"
          value={option[optionsValue]}
          id={prefix + option[optionsValue]}
          onChange={this.change.bind(this, option[optionsValue])}
          checked={this.checked(option)}
        />
        {this.label(option)}
      </li>
    );
  }

  render() {
    const { optionsValue, optionsLabel, placeholder } = this.props;

    let options = this.props.options.slice();
    const totalOptions = options.filter(option => {
      let notDefined;
      return (
        isNotAnEmptyGroup(option) &&
        (option.results === notDefined ||
          option.results > 0 ||
          !option.options ||
          option.options.length ||
          this.checked(option))
      );
    });
    options = totalOptions;
    options = options.map(option => {
      if (!option.options) {
        return option;
      }
      return {
        ...option,
        options: option.options.filter(_opt => {
          let notDefined;
          return _opt.results === notDefined || _opt.results > 0 || this.checked(_opt);
        }),
      };
    }) as Option[];

    if (this.state.filter) {
      options = filterOptions(this.state.filter, options, optionsLabel);
    }

    const tooManyOptions = !this.state.showAll && options.length > this.props.optionsToShow;

    if (this.props.sort) {
      options = this.sort(options, optionsValue, optionsLabel);
    } else {
      options = this.sortOnlyAggregates(options, optionsValue, optionsLabel);
    }

    if (this.props.forceHoist || (!this.props.sort && !this.state.showAll)) {
      options = this.hoistCheckedOptions(options);
    }

    if (tooManyOptions) {
      const numberOfActiveOptions = options.filter(opt => this.checked(opt)).length;
      const optionsToShow =
        this.props.optionsToShow > numberOfActiveOptions
          ? this.props.optionsToShow
          : numberOfActiveOptions;
      options = options.slice(0, optionsToShow);
    }

    options = options.map(option => {
      if (!option.options) {
        return option;
      }
      return { ...option, options: this.sort(option.options, optionsValue, optionsLabel, true) };
    }) as Option[];

    return (
      <ul className="multiselect is-active">
        <li className="multiselectActions">
          <ShowIf
            if={this.props.options.length > this.props.optionsToShow && !this.props.hideSearch}
          >
            <div className="form-group">
              <Icon
                icon={this.state.filter ? 'times-circle' : 'search'}
                onClick={this.resetFilter}
              />
              <input
                className="form-control"
                type="text"
                placeholder={placeholder || t('System', 'Search item', null, false)}
                value={this.state.filter}
                onChange={this.filter}
              />
            </div>
          </ShowIf>
        </li>
        {!options.length && <span>{t('System', 'No options found')}</span>}
        {options.map((option, index) => {
          if (option.options) {
            return this.renderGroup(option, index);
          }

          return this.renderOption(option, index);
        })}

        <li className="multiselectActions">
          <ShowIf if={totalOptions.length > this.props.optionsToShow && !this.state.showAll}>
            <button onClick={this.showAll} className="btn btn-xs btn-default">
              <Icon icon={this.state.showAll ? 'caret-up' : 'caret-down'} />
              &nbsp;
              {this.moreLessLabel(totalOptions)}
            </button>
          </ShowIf>
        </li>
      </ul>
    );
  }
}
