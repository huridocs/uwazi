import PropTypes from 'prop-types';
import React, {Component} from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import {removeNotification} from 'app/Notifications';

export class Notification extends Component {

  close() {
    this.props.removeNotification(this.props.id);
  }

  render() {
    let type = this.props.type || 'success';
    let cssClass = 'alert alert-' + type;
    let icon = 'fa fa-check';
    if (type === 'warning' || type === 'danger') {
      icon = 'fa fa-exclamation-triangle';
    }

    return (
        <div className={cssClass} onClick={this.close.bind(this)}>
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
