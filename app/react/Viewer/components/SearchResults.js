import React, {Component, PropTypes} from 'react';

export class SearchResults extends Component {
  render() {
    return (
      <div className="item-group">
          {(() => {
            if (this.props.searching) {
              return <div className="loader">Searching...</div>;
            }
            return this.props.results.toJS().map((result, index) => {
              return (
                <div className={'item ' + (this.props.selected === result._id ? 'is-selected' : '')}
                     key={index} onClick={() => this.props.onClick(result._id)}>
                  <div className="item-info">
                    <span className="item-type item-type-0">Document</span>
                    <div className="item-name">{result.title}</div>
                  </div>
                  <div className="item-actions">
                    <div className="item-shortcut"><i className="fa fa-angle-right"></i><span>Select document</span></div>
                  </div>
                </div>
              );
            });
          })()}
      </div>
    );
  }
}

SearchResults.propTypes = {
  results: PropTypes.object,
  selected: PropTypes.string,
  searching: PropTypes.bool,
  onClick: PropTypes.func
};

export default SearchResults;
