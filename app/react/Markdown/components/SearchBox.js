import { Form, Field } from 'react-redux-form';
import { browserHistory } from 'react-router';
import React from 'react';
import PropTypes from 'prop-types';
import rison from 'rison-node';
import { Icon } from 'UI';
import { t } from 'app/I18N';
import ModalTips from 'app/App/ModalTips';
import { SearchTipsContent } from 'app/App/SearchTipsContent';

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
    <ModalTips
      label={t('System', 'Search Tips', null, false)}
      title={t('System', 'Narrow down your searches', null, false)}
    >
      <SearchTipsContent />
    </ModalTips>
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
