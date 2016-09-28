import React, {Component, PropTypes} from 'react';
import {TemplateLabel, Icon} from 'app/Layout';

export class SearchResults extends Component {
  render() {
    return (
      <div className="item-group">
          {(() => {
            if (this.props.searching) {
              return <div className="loader">Searching...</div>;
            }
            return this.props.results.toJS().map((result, index) => {
              if (this.props.creatingToTarget && result.type === 'entity') {
                return false;
              }

              return (
                <div className={'item ' + (this.props.selected === result._id ? 'is-selected' : '')}
                     key={index} onClick={() => this.props.onClick(result._id)}>
                  <div className="item-info">
                    <div className="item-name">
                      <Icon className="item-icon" data={result.icon} />
                      {result.title}
                    </div>
                  </div>
                  <div className="item-actions">
                    <TemplateLabel template={result.template}/>
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
  onClick: PropTypes.func,
  creatingToTarget: PropTypes.bool
};

export default SearchResults;
