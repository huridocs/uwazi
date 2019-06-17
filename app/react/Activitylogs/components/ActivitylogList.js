import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import moment from 'moment';


class ActivityLogList extends Component {
  static renderMethod(method) {
    switch (method) {
    case 'POST':
      return (<span className="badge btn-color-6">{method}</span>);
    case 'GET':
      return (<span className="badge btn-color-9">{method}</span>);
    case 'PUT':
      return (<span className="badge btn-color-13">{method}</span>);
    default:
      return (<span className="badge btn-color-2">{method}</span>);
    }
  }

  static renderEntry(entry) {
    const time = `${moment(entry.get('time')).format('L')} ${moment(entry.get('time')).locale('en').format('LTS')}`;
    return (
      <tr key={entry.get('_id')}>
        <td>{ActivityLogList.renderMethod(entry.get('method'))}</td>
        <td>{entry.get('url')}</td>
        <td>{entry.get('username') || '-'}</td>
        <td className="tdquery">{entry.get('query')}</td>
        <td className="tdbody">{entry.get('body')}</td>
        <td>{time}</td>
      </tr>
    );
  }

  render() {
    const { activitylog } = this.props;
    return (
      <div className="activity-log-list">
        <table className="table">
          <thead>
            <tr>
              <th>Method</th>
              <th>Url</th>
              <th>User</th>
              <th>Query</th>
              <th>Body</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {activitylog.map(entry => ActivityLogList.renderEntry(entry))}
          </tbody>
        </table>
      </div>
    );
  }
}

ActivityLogList.propTypes = {
  activitylog: PropTypes.object.isRequired
};

export function mapStateToProps({ activitylog }) {
  return { activitylog };
}

export default connect(mapStateToProps, null)(ActivityLogList);
