import { Form, Field } from 'react-redux-form';
import { browserHistory } from 'react-router';
import React from 'react';
import rison from 'rison';

const search = ({ searchTerm }) => {
  browserHistory.push(`/library/?q=${rison.encode({ searchTerm })}`);
};

const SearchBox = () => (
  <Form model="library.search" onSubmit={search} >
    <Field model=".searchTerm">
      <input type="text" />
    </Field>
  </Form>
);

export default SearchBox;
