import React, { Component } from 'react';
import { iconNames } from 'UI/Icon/library';
import { CountryList } from 'UI';
import DropdownList from 'react-widgets/lib/DropdownList';
import IconSelectorItem from './IconSelectorItem';

export default class IconSelector extends Component {
  constructor(props) {
    super(props);
    const listOptions = [{ _id: null, type: 'Empty' }]
      .concat(
        iconNames.map(icon => ({
          _id: icon,
          type: 'Icons',
          label: icon,
        }))
      )
      .concat(
        Array.from(CountryList).map(country => ({
          _id: country[1].cca3,
          type: 'Flags',
          label: country[1].label,
        }))
      );

    this.state = { listOptions };
  }

  render() {
    return (
      <DropdownList
        valueField="_id"
        textField="label"
        data={this.state.listOptions}
        valueComponent={IconSelectorItem}
        itemComponent={IconSelectorItem}
        defaultValue={this.state.listOptions[0]}
        filter="contains"
        groupBy="type"
        {...this.props}
      />
    );
  }
}
