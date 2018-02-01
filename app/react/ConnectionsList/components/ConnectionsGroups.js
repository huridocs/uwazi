import PropTypes from 'prop-types';
import React, {Component} from 'react';
import {connect} from 'react-redux';

import {t} from 'app/I18N';

import ConnectionsGroup from './ConnectionsGroup';

export class ConnectionsGroups extends Component {
  render() {
    const {connectionsGroups} = this.props;

    let Results = <div className="blank-state">
                    <i className="fa fa-exchange"></i>
                    <h4>{t('System', 'No Relationships')}</h4>
                    <p>{t('System', 'No Relationships description')}</p>
                  </div>;

    if (connectionsGroups.size) {
      Results = <div>
                  <div className="nested-selector">
                    <ul className="multiselect is-active">
                      {connectionsGroups.map(group =>
                        <ConnectionsGroup key={group.get('key')}
                                          group={group} />
                      )}
                    </ul>
                  </div>
                </div>;
    }

    return Results;
  }
}

ConnectionsGroups.propTypes = {
  connectionsGroups: PropTypes.object
};

function mapStateToProps({relationships}) {
  return {
    connectionsGroups: relationships.list.connectionsGroups
  };
}

export default connect(mapStateToProps)(ConnectionsGroups);
