import React, {Component, PropTypes} from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import {removeNotification} from 'app/Notifications';

export class Notification extends Component {

  render() {
    let type = this.props.type || 'success';
    let cssClass = 'alert alert-' + type;
    let icon = 'fa fa-check';
    if (type === 'warning' || type === 'danger') {
      icon = 'fa fa-exclamation-triangle';
    }

    return (
        <div className={cssClass}>
          <i className={icon}>
          </i>
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
  return bindActionCreators({removeNotification}, dispatch);
}

export default connect(null, mapDispatchToProps)(Notification);
