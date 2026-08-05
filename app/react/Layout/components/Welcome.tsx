import React, { Component } from 'react';
import { Icon } from '#app/UI/index.js';
import { Translate } from '#app/I18N/index.js';

export class Welcome extends Component {
  render() {
    return (
      <div className="blank-state">
        <Icon icon="cog" />
        <h4>
          <Translate>Welcome to Uwazi</Translate>
        </h4>
        <a
          href="https://docs.uwazi.io/docs/tutorials/build-your-first-collection/"
          target="_blank"
          rel="noreferrer"
        >
          <Translate>Learn how to build your first collection</Translate>
        </a>
      </div>
    );
  }
}
