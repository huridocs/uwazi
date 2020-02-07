import React, { Component } from 'react';
import { Icon } from 'UI';
import SearchTips from 'app/Library/components/SearchTips';

export class SearchInput extends Component {
  render() {
    return (
      <div className="input-group">
        <input type="text" className="form-control" placeholder="Search" {...this.props} />
        <Icon icon="search" />
        <SearchTips />
      </div>
    );
  }
}

export default SearchInput;
