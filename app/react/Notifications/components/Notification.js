import React, {Component, PropTypes} from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import {removeNotification} from '~/Notifications';

export class Notification extends Component {

  render() {
    let type = this.props.type || 'info';
    let cssClass = 'alert alert-' + type;
    let icon = 'fa fa-info-circle';
    if (type === 'warning' || type === 'danger') {
      icon = 'fa fa-exclamation-triangle';
    }

    return (
        <div className="alert-wrapper">
          <div className={cssClass}>
            <span className="alert-icon">
              <i className={icon}></i>
            </span>
            <span className="alert-message">{this.props.message}</span>
            <a onClick={() => this.props.removeNotification(this.props.id)} className="alert-close">
              <i className="fa fa-times"></i>
            </a>
          </div>
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
  return bindActionCreators({removeNotification}, dispatch);
}

export default connect(null, mapDispatchToProps)(Notification);
