import React, { Component } from 'react';
import { I18NLink, Translate } from 'app/I18N';
import { NeedAuthorization } from 'app/Auth';
import { Icon } from 'app/UI';

export class SettingsNavigation extends Component {
  render() {
    return (
      <div>
        <div className="panel panel-default">
          <div className="panel-heading">
            <Translate>Settings</Translate>
          </div>
          <div className="list-group">
            <I18NLink to="settings/account" activeClassName="active" className="list-group-item">
              <Translate>Account</Translate>
            </I18NLink>
            <NeedAuthorization>
              <I18NLink to="settings/users" activeClassName="active" className="list-group-item">
                <Translate>Users</Translate>
              </I18NLink>
            </NeedAuthorization>
            <NeedAuthorization>
              <I18NLink
                to="settings/collection"
                activeClassName="active"
                className="list-group-item"
              >
                <Translate>Collection</Translate>
              </I18NLink>
            </NeedAuthorization>
            <NeedAuthorization>
              <I18NLink to="settings/navlinks" activeClassName="active" className="list-group-item">
                <Translate>Menu</Translate>
              </I18NLink>
            </NeedAuthorization>
            <NeedAuthorization>
              <I18NLink to="settings/pages" activeClassName="active" className="list-group-item">
                <Translate>Pages</Translate>
              </I18NLink>
            </NeedAuthorization>
            <NeedAuthorization>
              <I18NLink
                to="settings/languages"
                activeClassName="active"
                className="list-group-item"
              >
                <Translate>Languages</Translate>
              </I18NLink>
            </NeedAuthorization>
            <NeedAuthorization>
              <I18NLink
                to="settings/translations"
                activeClassName="active"
                className="list-group-item"
              >
                <Translate>Translations</Translate>
              </I18NLink>
            </NeedAuthorization>
            <NeedAuthorization>
              <I18NLink to="settings/filters" activeClassName="active" className="list-group-item">
                <Translate>Filters configuration</Translate>
              </I18NLink>
            </NeedAuthorization>
          </div>
        </div>
        <NeedAuthorization>
          <div className="panel panel-default">
            <div className="panel-heading">
              <Translate>Metadata</Translate>
            </div>
            <div className="list-group">
              <I18NLink
                to="settings/templates"
                activeClassName="active"
                className="list-group-item"
              >
                <Translate>Templates</Translate>
              </I18NLink>
              <I18NLink
                to="settings/dictionaries"
                activeClassName="active"
                className="list-group-item"
              >
                <Translate>Thesauri</Translate>
              </I18NLink>
              <I18NLink
                to="settings/connections"
                activeClassName="active"
                className="list-group-item"
              >
                <Translate>Relationship types</Translate>
              </I18NLink>
            </div>
          </div>
        </NeedAuthorization>
        <div className="panel panel-default">
          <div className="panel-heading">
            <Translate>Tools</Translate>
          </div>
          <div className="list-group">
            <NeedAuthorization roles={['admin']}>
              <I18NLink
                to="settings/activitylog"
                activeClassName="active"
                className="list-group-item"
              >
                <Translate>Activity log</Translate>
              </I18NLink>
            </NeedAuthorization>
            <a
              className="list-group-item"
              href="http://uwazi.readthedocs.io/en/latest/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span>
                <Translate>Documentation</Translate> <Icon icon="external-link-alt" />
              </span>
            </a>
          </div>
        </div>
      </div>
    );
  }
}

export default SettingsNavigation;
