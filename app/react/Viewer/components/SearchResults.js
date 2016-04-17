import React, {Component, PropTypes} from 'react';

export class SearchResults extends Component {
  render() {
    return (
      <div className="item-group">
          {(() => {
            if (this.props.searching) {
              return <div className="loader">Searching...</div>;
            }
            return this.props.results.map((result, index) => {
              return (
                <li key={index} onClick={() => this.props.onClick(result._id)}>
                  <div className={'item ' + (this.props.selected === result._id ? 'is-selected' : '')}>
                    <span className="item-name">{result.title}</span>
                  </div>
                </li>
              );
            });
          })()}
      </div>
    );
  }
}

SearchResults.propTypes = {
  results: PropTypes.array,
  selected: PropTypes.string,
  searching: PropTypes.bool,
  onClick: PropTypes.func
};

export default SearchResults;
