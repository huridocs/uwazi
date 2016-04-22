import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';

export class LibraryFilters extends Component {

  componentWillMount() {
    this.docTypes = [];
  }

  checkAll() {
    this.docTypes.forEach((ref) => {
      ref.checked = this.checkAll.checked;
    });
  }

  filterType(e) {
    
  }

  render() {
    return (
      <aside className="col-xs-12 col-sm-3">
        <div className="search">
          <div className="search__button--apply__filters">
            <a className="btn btn-success btn-block"><i className="fa fa-chevron-left"></i>Apply filters</a>
          </div>
          <ul className="search__filter search__filter--radiobutton">
            <li>Document type</li>
            <li>
              <input ref={(ref) => {this.checkAll = ref}} onClick={this.checkAll.bind(this)} id="all-documents" type="checkbox"/>
              <label htmlFor="all-documents">All documents</label>
            </li>
            {this.props.templates.map((template, index) => {
              return <li key={index}>
                      <input onChange={this.filterType.bind(this)} ref={(ref) => this.docTypes.push(ref)} id={template._id} type="checkbox"/>
                      <label htmlFor={template._id}>{template.name}</label>
                    </li>
            })}
          </ul>
        </div>
      </aside>
    );
  }
}

LibraryFilters.propTypes = {
  templates: PropTypes.array
};

export function mapStateToProps(state) {
  return state.library.filters.toJS();
}

export default connect(mapStateToProps)(LibraryFilters);
