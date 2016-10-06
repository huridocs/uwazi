import React, {Component} from 'react';
import {I18NLink} from 'app/I18N';

export class SettingsNavigation extends Component {

  render() {
    return <div>
    <div className="panel panel-default">
      <div className="panel-heading">Settings</div>
        <div className="list-group">
          <I18NLink to='/settings/account' activeClassName="active" className="list-group-item">Account</I18NLink>
          <I18NLink to='/settings/collection' activeClassName="active" className="list-group-item">Collection</I18NLink>
          <I18NLink to='/settings/navlinks' activeClassName="active" className="list-group-item">Menu</I18NLink>
          <I18NLink to='/settings/pages' activeClassName="active" className="list-group-item">Pages</I18NLink>
        </div>
      </div>
      <div className="panel panel-default">
        <div className="panel-heading">Metadata</div>
        <div className="list-group">
          <I18NLink to='/settings/documents' activeClassName="active" className="list-group-item">Documents</I18NLink>
          <I18NLink to='/settings/connections' activeClassName="active" className="list-group-item">Connections</I18NLink>
          <I18NLink to='/settings/dictionaries' activeClassName="active" className="list-group-item">Dictionaries</I18NLink>
          <I18NLink to='/settings/entities' activeClassName="active" className="list-group-item">Entities</I18NLink>
        </div>
      </div>
    </div>;
  }
}

export default SettingsNavigation;
