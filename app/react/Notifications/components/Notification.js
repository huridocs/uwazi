import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { removeNotification } from 'app/Notifications';
import { Icon } from 'UI';

export class Notification extends Component {
  close() {
    this.props.removeNotification(this.props.id);
  }

  render() {
    const type = this.props.type || 'success';
    const cssClass = `alert alert-${type}`;
    let icon = 'check';
    if (type === 'warning' || type === 'danger') {
      icon = 'exclamation-triangle';
    }

    return (
      <div className={cssClass} onClick={this.close.bind(this)}>
        <Icon icon={icon} />
        <span>{this.props.message}</span>
      </div>
    );
  }
}

Notification.propTypes = {
  type: PropTypes.string,
  id: PropTypes.string,
  message: PropTypes.string,
  removeNotification: PropTypes.func
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ removeNotification }, dispatch);
}

export default connect(null, mapDispatchToProps)(Notification);
