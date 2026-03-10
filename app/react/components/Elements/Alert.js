import PropTypes from 'prop-types';
import React, { Component } from 'react';
import './scss/alert.scss';
import { Icon } from 'UI';

class Alert extends Component {
  constructor(props) {
    super(props);
    const { message } = this.props;
    this.state = { show: !!message };
  }

  hide() {
    this.setState({ show: false });
  }

  render() {
    const { show } = this.state;
    const { type, message } = this.props;
    const cssClass = `alert alert-${type}`;
    let icon = 'info-circle';

    if (type === 'warning' || type === 'danger') {
      icon = 'exclamation-triangle';
    }

    return (
      <div className="alert-wrapper">
        {show && (
          <div className={cssClass}>
            <span className="alert-icon">
              <Icon icon={icon} />
            </span>
            <span className="alert-message">{message}</span>
            <a onClick={this.hide} className="alert-close">
              <Icon icon="times" />
            </a>
          </div>
        )}
      </div>
    );
  }
}

Alert.defaultProps = {
  message: '',
  type: 'info',
};

Alert.propTypes = {
  message: PropTypes.string,
  type: PropTypes.string,
};

export default Alert;
