import React, { Component } from 'react';

import { iconNames } from 'UI/Icon/library';
import countries from 'world-countries';

import DropdownList from './DropdownList';
import ListItem from './ListItem';

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
        countries.map(country => ({
          _id: country.cca2,
          type: 'Flags',
          label: country.name.common,
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
        valueComponent={ListItem}
        itemComponent={ListItem}
        defaultValue={this.state.listOptions[0]}
        filter="contains"
        groupBy="type"
        {...this.props}
      />
    );
  }
}
