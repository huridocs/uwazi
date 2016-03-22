import React, {Component, ReactDOM} from 'react';
import {events} from '../../utils/index';

class SearchBar extends Component {

  constructor(props) {
    super(props);
    this.state = {search: ''};
  }

  handleChange() {
    this.setState({search: this.field.value});
  }

  search(e) {
    e.preventDefault();
    events.emit('search', this.state.search);
  }

  render() {
    return (
      <form onSubmit={this.search.bind(this)}>
        <div className="input-group">
          <span className="input-group-btn">
            <button className="btn btn-default"><i className="fa fa-search"></i><i className="fa fa-close"></i></button></span>
            <input
              ref={(ref)=> this.field = ref}
              type="text"
              placeholder="Search"
              className="form-control"
              value={this.state.value}
              onChange={this.handleChange.bind(this)}
            />
          <div className="search-suggestions">
            <p> <b>Africa</b> Legal Aid (on behalf of Isaac and Robert Banda) Gambia (The)<i className="fa fa-arrow-left"></i></p>
            <p>149 96 <b>Africa</b> Sir Dawda K. Jawara Gambia (The)<i className="fa fa-arrow-left"></i></p>
            <p>Democratic Republic of Congo Burundi, Rwanda, Uganda, <b>Africa</b><i className="fa fa-arrow-left"></i></p>
            <p id="all-africa-documents" className="search-suggestions-all"><i className="fa fa-search"></i>See all documents for "africa"</p>
          </div>
        </div>
      </form>
    );
  }
}

export default SearchBar;
