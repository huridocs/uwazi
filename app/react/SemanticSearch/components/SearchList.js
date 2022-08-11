import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import SearchItem from './SearchItem';

const SearchList = ({ searches }) => (
  <div className="semantic-search-list">
    {searches.map(search => (
      <SearchItem search={search} key={search._id} />
    ))}
  </div>
);

SearchList.defaultProps = {
  searches: [],
};

SearchList.propTypes = {
  searches: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string,
      searchTerm: PropTypes.string,
      documents: PropTypes.array,
      status: PropTypes.string,
    })
  ),
};

export { SearchList };
export default connect()(SearchList);
