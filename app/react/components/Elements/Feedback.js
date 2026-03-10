import PropTypes from 'prop-types';
import React, { Component } from 'react';
import './scss/feedback.scss';
import { Icon } from 'UI';

class Feedback extends Component {
  render() {
    const type = this.props.type || 'info';
    if (type === 'success') {
      return (
        <span className="feedback feedback-success">
          <Icon icon="check" /> {this.props.children}
        </span>
      );
    }
    if (type === 'error') {
      return (
        <span className="feedback feedback-error">
          <Icon icon="exclamation-triangle" /> {this.props.children}
        </span>
      );
    }
    if (type === 'info') {
      return (
        <span className="feedback feedback-info">
          <Icon icon="info-circle" /> {this.props.children}
        </span>
      );
    }
  }
}

Feedback.propTypes = {
  type: PropTypes.string,
  children: PropTypes.array,
};

export default Feedback;
