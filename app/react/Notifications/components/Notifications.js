import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';

import Notification from 'app/Notifications/components/Notification';

export class Notifications extends Component {

  render() {
    return (
        <div>
          {this.props.notifications.map((notification) => {
            return <Notification key={notification.id} {...notification}/>;
          })}
        </div>
    );
  }

}

Notifications.propTypes = {
  notifications: PropTypes.array
};

const mapStateToProps = (state) => {
  return {notifications: state.notifications.toJS()};
};

export default connect(mapStateToProps)(Notifications);
