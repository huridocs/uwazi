import PropTypes from 'prop-types';
import React, { Component } from 'react';
import './scss/stackTrace.scss';
import { Icon } from 'UI';

class StackTrace extends Component {
  constructor(props) {
    super(props);
    this.state = { expand: false };
    this.toggle = this.toggle.bind(this);
  }

  toggle() {
    const { expand } = this.state;
    this.setState({ expand: !expand });
  }

  render() {
    const { message } = this.props;
    const { expand } = this.state;
    const formatedMessage = expand ? message : `${message.substr(0, 50)}...`;
    return (
      <div className="stack-trace" onClick={this.toggle}>
        <Icon icon="sort"/>
        &nbsp;<span>{formatedMessage}</span>
      </div>
    );
  }
}

StackTrace.defaultProps = {
  message: '',
};

StackTrace.propTypes = {
  message: PropTypes.string,
};

export default StackTrace;
