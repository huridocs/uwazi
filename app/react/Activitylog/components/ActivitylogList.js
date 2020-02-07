import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { List } from 'immutable';
import ActivitylogRow from './ActivitylogRow';

class ActivityLogList extends Component {
  render() {
    const { list } = this.props;
    return (
      <div className="activity-log-list">
        <table className="table">
          <thead>
            <tr>
              <th>Action</th>
              <th>User</th>
              <th className="activitylog-description">Description</th>
              <th className="activitylog-time">Time</th>
            </tr>
          </thead>
          <tbody>
            {list.map(entry => (
              <ActivitylogRow entry={entry} key={entry.get('_id')} />
            ))}
          </tbody>
        </table>
      </div>
    );
  }
}

ActivityLogList.propTypes = {
  list: PropTypes.instanceOf(List).isRequired,
};

export function mapStateToProps({ activitylog }) {
  return { list: activitylog.list };
}

export default connect(mapStateToProps, null)(ActivityLogList);
