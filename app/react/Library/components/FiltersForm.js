import React, {Component, PropTypes} from 'react';
import {reduxForm} from 'redux-form';
import {bindActionCreators} from 'redux';

import {DynamicFields} from 'app/Form';
import {searchDocuments} from 'app/Library/actions/libraryActions';

export class FiltersForm extends Component {

  search(values) {
    this.props.searchDocuments(this.props.searchTerm, values);
  }

  render() {
    return (
      <form id="filters-form" onSubmit={this.props.handleSubmit(this.search.bind(this))}>
        <DynamicFields fields={this.props.fields} template={this.props.properties} />
      </form>
    );
  }
}

FiltersForm.propTypes = {
  fields: PropTypes.object.isRequired,
  properties: PropTypes.array.isRequired,
  searchDocuments: PropTypes.func,
  handleSubmit: PropTypes.func,
  searchTerm: PropTypes.string
};

export function mapStateToProps(state) {
  let properties = state.library.filters.toJS().properties;
  let fields = properties.map((property) => property.name);
  let searchTerm = state.library.ui.toJS().searchTerm;
  return {
    fields,
    properties,
    searchTerm
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({searchDocuments}, dispatch);
}

let form = reduxForm({form: 'filters'}, mapStateToProps, mapDispatchToProps)(FiltersForm);

export default form;
