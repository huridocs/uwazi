import PropTypes from 'prop-types';
import React, {Component} from 'react';
import {connect} from 'react-redux';

import ShowIf from 'app/App/ShowIf';

import SearchBar from './SearchBar';
import ConnectionsGroup from './ConnectionsGroup';

export class ConnectionsGroups extends Component {
  render() {
    const {connectionsGroups} = this.props;

    return (
      <ShowIf if={Boolean(connectionsGroups.size)}>
        <div>
          <SearchBar />
          <div className="nested-selector">
            <ul className="multiselect is-active">
              {connectionsGroups.map(group =>
                <ConnectionsGroup key={group.get('key')}
                                  group={group} />
              )}
            </ul>
          </div>
        </div>
      </ShowIf>
    );
  }
}

ConnectionsGroups.propTypes = {
  connectionsGroups: PropTypes.object
};

function mapStateToProps({connectionsList}) {
  return {
    connectionsGroups: connectionsList.connectionsGroups
  };
}

export default connect(mapStateToProps)(ConnectionsGroups);
