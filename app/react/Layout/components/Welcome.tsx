import React, { Component } from 'react';
import { Icon } from 'UI';

export default class Welcome extends Component {
  render() {
    return (
      <div className="blank-state">
        <Icon icon="cog" />
        <h4>Welcome to Uwazi</h4>
        <a href="https://uwazi.readthedocs.io/en/latest/" target="_blank" rel="noreferrer">
          Learn more
        </a>
      </div>
    );
  }
}

//TEST
