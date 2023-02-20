import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { SearchItem } from './SearchItem';

const SearchListComponent = ({ searches }) => (
  <div className="semantic-search-list">
    {searches.map(search => (
      <SearchItem search={search} key={search._id} />
    ))}
  </div>
);

SearchListComponent.defaultProps = {
  searches: [],
};

SearchListComponent.propTypes = {
  searches: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string,
      searchTerm: PropTypes.string,
      documents: PropTypes.array,
      status: PropTypes.string,
    })
  ),
};

export { SearchListComponent };
export default connect()(SearchListComponent);
