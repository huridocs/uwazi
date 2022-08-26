import PropTypes from 'prop-types';
import Immutable from 'immutable';
import React, { Component } from 'react';
import { Icon } from 'UI';
import { connect } from 'react-redux';
import { t } from 'app/I18N';

import ConnectionsGroup from './ConnectionsGroup';

class ConnectionsGroupsComponent extends Component {
  render() {
    const { connectionsGroups } = this.props;

    let Results = (
      <div className="blank-state">
        <Icon icon="exchange-alt" />
        <h4>{t('System', 'No Relationships')}</h4>
        <p>{t('System', 'No Relationships description')}</p>
      </div>
    );

    if (connectionsGroups.size) {
      if (this.props.sidePanelTrigger === 'library') {
        Results = (
          <div styles={{ padding: '20px' }}>
            <div className="list-group">
              {connectionsGroups.map(group => (
                <div className="list-group-item">{group.get('connectionLabel')}</div>
              ))}
            </div>
          </div>
        );
      } else {
        Results = (
          <div>
            <div className="nested-selector">
              <ul className="multiselect is-active">
                {connectionsGroups.map(group => (
                  <ConnectionsGroup key={group.get('key')} group={group} />
                ))}
              </ul>
            </div>
          </div>
        );
      }
    }

    return Results;
  }
}

ConnectionsGroupsComponent.propTypes = {
  connectionsGroups: PropTypes.instanceOf(Immutable.List).isRequired,
  sidePanelTrigger: PropTypes.string.isRequired,
};

function mapStateToProps({ relationships, library }) {
  return {
    connectionsGroups: relationships.list.connectionsGroups,
    sidePanelTrigger: library.sidepanel.trigger,
  };
}

export const ConnectionsGroups = connect(mapStateToProps)(ConnectionsGroupsComponent);
