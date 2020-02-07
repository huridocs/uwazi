import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Icon } from 'UI';
import { removeNotification } from '../actions/notificationsActions';

export class Notification extends Component {
  close() {
    this.props.removeNotification(this.props.id);
  }

  render() {
    const { type, message } = this.props;
    const cssClass = `alert alert-${type}`;
    let icon = 'check';
    if (type === 'warning' || type === 'danger') {
      icon = 'exclamation-triangle';
    }

    return (
      <div className={cssClass} onClick={this.close.bind(this)}>
        <Icon icon={icon} />
        <span>{message}</span>
        <Icon icon="times" />
      </div>
    );
  }
}

Notification.defaultProps = {
  type: 'success',
};

Notification.propTypes = {
  type: PropTypes.string,
  id: PropTypes.string.isRequired,
  message: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
  removeNotification: PropTypes.func.isRequired,
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ removeNotification }, dispatch);
}

export default connect(null, mapDispatchToProps)(Notification);
