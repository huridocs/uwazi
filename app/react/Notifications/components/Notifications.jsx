import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import { NotificationConnected as Notification } from './Notification.js';

class Notifications extends Component {
  render() {
    return (
      <div className="alert-wrapper">
        {this.props.notifications.map(notification => (
          <Notification key={notification.id} {...notification} />
        ))}
      </div>
    );
  }
}

Notifications.propTypes = {
  notifications: PropTypes.array,
};

Notifications.defaultProps = {
  notifications: [],
};

const mapStateToProps = state => ({ notifications: state.notifications.toJS() });

const NotificationsConnected = connect(mapStateToProps)(Notifications);
export { Notifications as NotificationsView, NotificationsConnected as Notifications };
