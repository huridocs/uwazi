import React, {Component, PropTypes} from 'react';
import {TemplateLabel, Icon} from 'app/Layout';
import Loader from 'app/components/Elements/Loader';

export class SearchResults extends Component {
  render() {
    const loading = <div className="cs-loader-container">&nbsp;<Loader /></div>;
    const results = this.props.results.toJS().map((result, index) => {
      if (this.props.creatingToTarget && result.type === 'entity') {
        return false;
      }

      return (
        <div className={'item ' + (this.props.selected === result._id ? 'is-selected' : '')}
             key={index} onClick={() => this.props.onClick(result._id)}>
          <div className="item-info">
            <div className="item-name">
              <Icon className="item-icon item-icon-center" data={result.icon} />
              {result.title}
            </div>
          </div>
          <div className="item-actions">
            <TemplateLabel template={result.template}/>
          </div>
        </div>
      );
    });

    return (
      <div>
        {this.props.searching ? loading : ''}
        <div className="item-group">
          {results}
        </div>
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
