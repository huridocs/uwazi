import React, {Component} from 'react';
import {I18NLink, t} from 'app/I18N';
import {NeedAuthorization} from 'app/Auth';

export class SettingsNavigation extends Component {

  render() {
    return <div>
      <div className="panel panel-default">
        <div className="panel-heading">{t('System', 'Settings')}</div>
        <div className="list-group">
          <I18NLink to='settings/account' activeClassName="active" className="list-group-item">{t('System', 'Account')}</I18NLink>
          <NeedAuthorization>
            <I18NLink to='settings/users' activeClassName="active" className="list-group-item">{t('System', 'Users')}</I18NLink>
          </NeedAuthorization>
          <NeedAuthorization>
            <I18NLink to='settings/collection' activeClassName="active" className="list-group-item">{t('System', 'Collection')}</I18NLink>
          </NeedAuthorization>
          <NeedAuthorization>
            <I18NLink to='settings/navlinks' activeClassName="active" className="list-group-item">{t('System', 'Menu')}</I18NLink>
          </NeedAuthorization>
          <NeedAuthorization>
            <I18NLink to='settings/pages' activeClassName="active" className="list-group-item">{t('System', 'Pages')}</I18NLink>
          </NeedAuthorization>
          <NeedAuthorization>
            <I18NLink to='settings/translations' activeClassName="active" className="list-group-item">{t('System', 'Translations')}</I18NLink>
          </NeedAuthorization>
          <NeedAuthorization>
            <I18NLink to='settings/filters' activeClassName="active" className="list-group-item">{t('System', 'Filters configuration')}</I18NLink>
          </NeedAuthorization>
        </div>
      </div>
      <NeedAuthorization>
        <div className="panel panel-default">
          <div className="panel-heading">{t('System', 'Metadata')}</div>
          <div className="list-group">
            <I18NLink to='settings/documents' activeClassName="active" className="list-group-item">{t('System', 'Document types')}</I18NLink>
            <I18NLink to='settings/entities' activeClassName="active" className="list-group-item">{t('System', 'Entity types')}</I18NLink>
            <I18NLink to='settings/dictionaries' activeClassName="active" className="list-group-item">{t('System', 'Thesauri')}</I18NLink>
            <I18NLink to='settings/connections' activeClassName="active" className="list-group-item">{t('System', 'Connections')}</I18NLink>
          </div>
        </div>
      </NeedAuthorization>
    </div>;
  }
}

export default SettingsNavigation;
