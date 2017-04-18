import PropTypes from 'prop-types';
import React, { Component } from 'react';
import './scss/alert.scss';

class Alert extends Component {

  constructor(props) {
    super(props);
    this.state = {show: !!this.props.message};
  }

  hide() {
    this.setState({show: false});
  }

  show() {
    this.setState({show: true});
  }

  render() {
    let type = this.props.type || 'info';
    let cssClass = 'alert alert-' + type;
    let icon = 'fa fa-info-circle';
    if (type === 'warning' || type === 'danger') {
      icon = 'fa fa-exclamation-triangle';
    }

    return (
        <div className="alert-wrapper">
        {(() => {
          if (this.state.show) {
            return (
            <div className={cssClass}><span className="alert-icon">
              <i className={icon}></i>
              </span><span className="alert-message">{this.props.message}</span>
              <a onClick={this.hide} className="alert-close">
                <i className="fa fa-times"></i>
              </a>
            </div>
            );
          }
        })()}
        </div>
    );
  }
}

Alert.propTypes = {
  message: PropTypes.string,
  type: PropTypes.string
};

export default Alert;
