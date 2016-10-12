import React, {Component} from 'react';
import {I18NLink, t} from 'app/I18N';

export class SettingsNavigation extends Component {

  render() {
    return <div>
    <div className="panel panel-default">
      <div className="panel-heading">{t('Settings')}</div>
        <div className="list-group">
          <I18NLink to='/settings/account' activeClassName="active" className="list-group-item">{t('Account')}</I18NLink>
          <I18NLink to='/settings/collection' activeClassName="active" className="list-group-item">{t('Collection')}</I18NLink>
          <I18NLink to='/settings/navlinks' activeClassName="active" className="list-group-item">{t('Menu')}</I18NLink>
          <I18NLink to='/settings/pages' activeClassName="active" className="list-group-item">{t('Pages')}</I18NLink>
        </div>
      </div>
      <div className="panel panel-default">
        <div className="panel-heading">{t('Metadata')}</div>
        <div className="list-group">
          <I18NLink to='/settings/documents' activeClassName="active" className="list-group-item">{t('Documents')}</I18NLink>
          <I18NLink to='/settings/connections' activeClassName="active" className="list-group-item">{t('Connections')}</I18NLink>
          <I18NLink to='/settings/dictionaries' activeClassName="active" className="list-group-item">{t('Dictionaries')}</I18NLink>
          <I18NLink to='/settings/entities' activeClassName="active" className="list-group-item">{t('Entities')}</I18NLink>
        </div>
      </div>
    </div>;
  }
}

export default SettingsNavigation;
