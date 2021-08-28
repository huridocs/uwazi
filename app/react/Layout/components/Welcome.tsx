import React, { Component } from 'react';
import { Icon } from 'UI';
import { Translate } from 'app/I18N';

export default class Welcome extends Component {
  render() {
    return (
      <div className="blank-state">
        <Icon icon="cog" />
        <h4>
          <Translate>Welcome to Uwazi</Translate>
        </h4>
        <a href="https://uwazi.readthedocs.io/en/latest/" target="_blank" rel="noreferrer">
          <Translate>Learn more</Translate>
        </a>
      </div>
    );
  }
}
