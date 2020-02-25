import React, { Component } from 'react';
import { I18NLink, t } from 'app/I18N';
import { NeedAuthorization } from 'app/Auth';

export class SettingsNavigation extends Component {
  render() {
    return (
      <div>
        <div className="panel panel-default">
          <div className="panel-heading">{t('System', 'Settings')}</div>
          <div className="list-group">
            <I18NLink to="settings/account" activeClassName="active" className="list-group-item">
              {t('System', 'Account')}
            </I18NLink>
            <NeedAuthorization>
              <I18NLink to="settings/users" activeClassName="active" className="list-group-item">
                {t('System', 'Users')}
              </I18NLink>
            </NeedAuthorization>
            <NeedAuthorization>
              <I18NLink
                to="settings/collection"
                activeClassName="active"
                className="list-group-item"
              >
                {t('System', 'Collection')}
              </I18NLink>
            </NeedAuthorization>
            <NeedAuthorization>
              <I18NLink to="settings/navlinks" activeClassName="active" className="list-group-item">
                {t('System', 'Menu')}
              </I18NLink>
            </NeedAuthorization>
            <NeedAuthorization>
              <I18NLink to="settings/pages" activeClassName="active" className="list-group-item">
                {t('System', 'Pages')}
              </I18NLink>
            </NeedAuthorization>
            <NeedAuthorization>
              <I18NLink
                to="settings/languages"
                activeClassName="active"
                className="list-group-item"
              >
                {t('System', 'Languages')}
              </I18NLink>
            </NeedAuthorization>
            <NeedAuthorization>
              <I18NLink
                to="settings/translations"
                activeClassName="active"
                className="list-group-item"
              >
                {t('System', 'Translations')}
              </I18NLink>
            </NeedAuthorization>
            <NeedAuthorization>
              <I18NLink to="settings/filters" activeClassName="active" className="list-group-item">
                {t('System', 'Filters configuration')}
              </I18NLink>
            </NeedAuthorization>
          </div>
        </div>
        <NeedAuthorization>
          <div className="panel panel-default">
            <div className="panel-heading">{t('System', 'Metadata')}</div>
            <div className="list-group">
              <I18NLink
                to="settings/templates"
                activeClassName="active"
                className="list-group-item"
              >
                {t('System', 'Templates')}
              </I18NLink>
              <I18NLink
                to="settings/dictionaries"
                activeClassName="active"
                className="list-group-item"
              >
                {t('System', 'Thesauri')}
              </I18NLink>
              <I18NLink
                to="settings/connections"
                activeClassName="active"
                className="list-group-item"
              >
                {t('System', 'Relationship types')}
              </I18NLink>
            </div>
          </div>
        </NeedAuthorization>
        <NeedAuthorization roles={['admin']}>
          <div className="panel panel-default">
            <div className="panel-heading">{t('System', 'Tools')}</div>
            <div className="list-group">
              <I18NLink
                to="settings/activitylog"
                activeClassName="active"
                className="list-group-item"
              >
                {t('System', 'Activity log')}
              </I18NLink>
            </div>
          </div>
        </NeedAuthorization>
      </div>
    );
  }
}

export default SettingsNavigation;
