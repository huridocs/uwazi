import PropTypes from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import {t} from 'app/I18N';

import {loadMoreReferences} from '../../ConnectionsList/actions/actions';

export const LoadMoreRelationshipsButton = ({totalHubs, requestedHubs, action, loadMoreAmmount}) => {
  if (requestedHubs < totalHubs) {
    const actionFunction = () => {
      action(requestedHubs + loadMoreAmmount);
    };

    return (
      <div>
        <p className="col-sm-12 text-center documents-counter">
          <b>{requestedHubs}</b>{` ${t('System', 'of')} `}<b>{totalHubs}</b>{` ${t('System', 'hubs')}`}
        </p>
        <button onClick={actionFunction} className="btn btn-default btn-load-more">
         {loadMoreAmmount + ' ' + t('System', 'x more')}
        </button>
      </div>
    );
  }

  return null;
};

LoadMoreRelationshipsButton.propTypes = {
  totalHubs: PropTypes.number,
  requestedHubs: PropTypes.number,
  loadMoreAmmount: PropTypes.number,
  action: PropTypes.func
};

export const mapStateToProps = ({relationships}) => {
  return {
    totalHubs: relationships.list.searchResults.get('totalHubs'),
    requestedHubs: relationships.list.searchResults.get('requestedHubs'),
    loadMoreAmmount: 10
  };
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    action: loadMoreReferences
  }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(LoadMoreRelationshipsButton);
