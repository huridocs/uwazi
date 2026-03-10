/** @format */

import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { List } from 'immutable';
import './scss/stackTrace.scss';
import { Icon } from 'UI';

const conformValidations = (expand, validations) => {
  if (!expand || !validations) {
    return null;
  }

  return (
    <>
      {validations.reduce(
        (memo, v, i) =>
          memo.concat(
            // eslint-disable-next-line react/no-array-index-key
            <div key={i}>
              {v.get('message')}: {v.get('instancePath')}
            </div>
          ),
        []
      )}
    </>
  );
};

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
    const { message, validations } = this.props;
    const { expand } = this.state;
    const formatedMessage = expand ? message : `${message.substr(0, 50)}...`;
    return (
      <div className="stack-trace" onClick={this.toggle}>
        <Icon icon="sort" />
        &nbsp;
        <span>{formatedMessage}</span>
        {conformValidations(expand, validations)}
      </div>
    );
  }
}

StackTrace.defaultProps = {
  message: '',
  validations: null,
};

StackTrace.propTypes = {
  message: PropTypes.string,
  validations: PropTypes.instanceOf(List),
};

export default StackTrace;
