import { Form, Field } from 'react-redux-form';
import { browserHistory } from 'react-router';
import React from 'react';
import PropTypes from 'prop-types';
import rison from 'rison';
import { Icon } from 'UI';
import SearchTips from 'app/Library/components/SearchTips';

const search = ({ searchTerm }) => {
  browserHistory.push(`/library/?q=${rison.encode({ searchTerm })}`);
};

const SearchBox = ({ placeholder, classname }) => (
  <div className={`search-box ${classname}`}>
    <Form model="library.search" onSubmit={search}>
      <div className="input-group">
        <button type="submit" className="btn btn-primary">
          <Icon icon="search" />
        </button>
        <Field model=".searchTerm">
          <input className="form-control" type="text" placeholder={placeholder} />
        </Field>
      </div>
    </Form>
    <SearchTips />
  </div>
);

SearchBox.defaultProps = {
  placeholder: '',
  classname: '',
};

SearchBox.propTypes = {
  placeholder: PropTypes.string,
  classname: PropTypes.string,
};

export default SearchBox;
