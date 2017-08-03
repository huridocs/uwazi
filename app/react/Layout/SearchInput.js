import React, {Component} from 'react';

export class SearchInput extends Component {
  render() {
    return (
      <div className="form-group">
        <i className="fa fa-search"></i>
        <input type="text" className="form-control" placeholder="Search" {...this.props}/>
      </div>
    );
  }
}

export default SearchInput;
