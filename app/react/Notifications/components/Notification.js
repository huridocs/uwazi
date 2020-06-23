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
        <span className="alert-text">
          {message.split('\n').map((item, i) => (
            //eslint-disable-next-line react/no-array-index-key
            <React.Fragment key={i}>
              {item}
              <br />
            </React.Fragment>
          ))}
        </span>
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
