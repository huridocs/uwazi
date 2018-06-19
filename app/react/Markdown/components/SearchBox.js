import { Form, Field } from 'react-redux-form';
import { browserHistory } from 'react-router';
import React from 'react';
import PropTypes from 'prop-types';
import rison from 'rison';

const search = ({ searchTerm }) => {
  browserHistory.push(`/library/?q=${rison.encode({ searchTerm })}`);
};

const SearchBox = ({ placeholder, className }) => (
  <div className={`search-box ${className}`}>
    <Form model="library.search" onSubmit={search} >
      <div className="input-group">
        <button type="submit">
          <i className="fa fa-search" />
        </button>
        <Field model=".searchTerm">
          <input className="form-control" type="text" placeholder={placeholder} />
        </Field>
      </div>
    </Form>
  </div>
);

SearchBox.defaultProps = {
  placeholder: '',
  className: '',
};

SearchBox.propTypes = {
  placeholder: PropTypes.string,
  className: PropTypes.string,
};

export default SearchBox;
