import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import moment from 'moment';
import { List } from 'immutable';

class ActivityLogList extends Component {
  static renderMethod(method) {
    switch (method) {
    case 'CREATE':
      return (<span className="badge btn-color-9">{method}</span>);
    case 'UPDATE':
      return (<span className="badge btn-color-6">{method}</span>);
    case 'DELETE':
      return (<span className="badge btn-color-2">{method}</span>);
    case 'RAW':
      return (<span className="badge btn-color-17">{method}</span>);
    default:
      return (<span className="badge btn-color-17">{method}</span>);
    }
  }

  static renderEntry(entry) {
    const time = `${moment(entry.get('time')).format('L')} ${moment(entry.get('time')).locale('en').format('LTS')}`;
    const semanticData = entry.get('semantic').toJS();

    let description = <span className="activitylog-extra">{ entry.get('method') } : { entry.get('url') }</span>;

    if (semanticData.beautified) {
      description = (
        <span>
          <span className="activitylog-prefix">{semanticData.description}</span>
          <span className="activitylog-name"> {semanticData.name}</span>
          <span className="activitylog-extra"> {semanticData.extra}</span>
        </span>
      );
    }

    return (
      <tr className={semanticData.beautified ? 'activitylog-beautified' : 'activitylog-raw'} key={entry.get('_id')}>
        <td>{semanticData.beautified ? ActivityLogList.renderMethod(semanticData.action) : ActivityLogList.renderMethod('RAW')}</td>
        <td>{entry.get('username') || '-'}</td>
        <td>{description}</td>
        <td className="activitylog-time">{time}</td>
      </tr>
    );
  }

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
            {list.map(entry => ActivityLogList.renderEntry(entry))}
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
