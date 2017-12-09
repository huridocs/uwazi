import PropTypes from 'prop-types';
import React, {Component} from 'react';
import {TemplateLabel, Icon} from 'app/Layout';
import Loader from 'app/components/Elements/Loader';

export class SearchResults extends Component {
  render() {
    const loading = <div className="cs-loader-container">&nbsp;<Loader /></div>;
    const results = this.props.results.toJS().map((result, index) => {
      return (
        <div className={'item ' + (this.props.selected === result.sharedId ? 'is-selected' : '')}
             key={index}
             onClick={() => this.props.onClick(result.sharedId, result)}>
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
  onClick: PropTypes.func
};

export default SearchResults;
