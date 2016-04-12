import React, {Component} from 'react';
import './scss/sidepanel.scss';

export class SearchInput extends Component {
  render() {
    return (
      <div className="input-group">
        <input type="text" className="form-control" {...this.props}/>
        <span className="input-group-addon">
          <i className="fa fa-search"></i>
        </span>
      </div>
    );
  }
}

export default SearchInput;
