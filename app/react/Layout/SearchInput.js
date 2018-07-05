import React, {Component} from 'react';
import { Icon } from 'UI';

export class SearchInput extends Component {
  render() {
    return (
      <div className="form-group">
        <Icon icon="search" />
        <input type="text" className="form-control" placeholder="Search" {...this.props}/>
      </div>
    );
  }
}

export default SearchInput;
