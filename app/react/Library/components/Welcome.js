import React, {Component} from 'react';
import {I18NLink} from 'app/I18N';
import { Icon } from 'UI';

export default class Welcome extends Component {
  render() {
    return (
      <div className="blank-state">
        <Icon icon="cog" />
        <h4>Welcome to Uwazi</h4>
        <p>To start you need to create some templates in <I18NLink to='/settings/account'>settings</I18NLink></p>
        <a href="https://github.com/huridocs/uwazi/wiki" target="_blank">Learn more</a>
      </div>
    );
  }
}
