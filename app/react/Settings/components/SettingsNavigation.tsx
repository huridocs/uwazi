import React from 'react';
import { I18NLink, Translate } from 'app/I18N';
import { NeedAuthorization } from 'app/Auth';
import { Icon } from 'app/UI';
import { PreserveIcon } from 'app/Layout/PreserveIcon';
import { FeatureToggle } from 'app/components/Elements/FeatureToggle';
import { connect } from 'react-redux';

const SettingsNavigationComponent = ({ allowcustomJS }: { allowcustomJS: boolean }) => (
  <div>
    <div className="panel panel-default">
      <div className="panel-heading">
        <Translate>Settings</Translate>
      </div>
      <div className="list-group">
        <I18NLink to="settings/account" activeclassname="active" className="list-group-item">
          <Translate>Account</Translate>
        </I18NLink>
        <NeedAuthorization roles={['admin']}>
          <I18NLink to="settings/dashboard" activeclassname="active" className="list-group-item">
            <Translate>Dashboard</Translate>
          </I18NLink>
        </NeedAuthorization>
        <NeedAuthorization roles={['admin']}>
          <I18NLink to="settings/users" activeclassname="active" className="list-group-item">
            <Translate>Users & Groups</Translate>
          </I18NLink>
        </NeedAuthorization>
        <NeedAuthorization roles={['admin']}>
          <I18NLink to="settings/collection" activeclassname="active" className="list-group-item">
            <Translate>Collection</Translate>
          </I18NLink>
        </NeedAuthorization>
        <NeedAuthorization roles={['admin']}>
          <I18NLink to="settings/navlinks" activeclassname="active" className="list-group-item">
            <Translate>Menu</Translate>
          </I18NLink>
        </NeedAuthorization>
        <NeedAuthorization roles={['admin']}>
          <I18NLink to="settings/pages" activeclassname="active" className="list-group-item">
            <Translate>Pages</Translate>
          </I18NLink>
        </NeedAuthorization>
        <NeedAuthorization roles={['admin']}>
          <I18NLink to="settings/languages" activeclassname="active" className="list-group-item">
            <Translate>Languages</Translate>
          </I18NLink>
        </NeedAuthorization>
        <NeedAuthorization roles={['admin']}>
          <I18NLink to="settings/translations" activeclassname="active" className="list-group-item">
            <Translate>Translations</Translate>
          </I18NLink>
        </NeedAuthorization>
        <NeedAuthorization roles={['admin']}>
          <I18NLink to="settings/filters" activeclassname="active" className="list-group-item">
            <Translate>Filters configuration</Translate>
          </I18NLink>
        </NeedAuthorization>
      </div>
    </div>
    <div className="panel panel-default">
      <NeedAuthorization roles={['admin']}>
        <div className="panel-heading">
          <Translate>Metadata</Translate>
        </div>
      </NeedAuthorization>
      <div className="list-group">
        <NeedAuthorization roles={['admin']}>
          <I18NLink to="settings/templates" activeclassname="active" className="list-group-item">
            <Translate>Templates</Translate>
          </I18NLink>
        </NeedAuthorization>
        <FeatureToggle feature="metadataExtraction.url">
          <NeedAuthorization roles={['admin']}>
            <I18NLink
              to="settings/metadata_extraction"
              activeclassname="active"
              className="list-group-item"
            >
              <Translate>Metadata Extraction</Translate>
            </I18NLink>
          </NeedAuthorization>
        </FeatureToggle>
        <NeedAuthorization roles={['admin']}>
          <I18NLink to="settings/thesauri" activeclassname="active" className="list-group-item">
            <Translate>Thesauri</Translate>
          </I18NLink>
        </NeedAuthorization>
        <NeedAuthorization roles={['admin']}>
          <I18NLink to="settings/connections" activeclassname="active" className="list-group-item">
            <Translate>Relationship types</Translate>
          </I18NLink>
        </NeedAuthorization>
      </div>

      <div className="panel-heading">
        <Translate>Tools</Translate>
      </div>
      <div className="list-group">
        <FeatureToggle feature="preserve.host">
          <NeedAuthorization roles={['admin']}>
            <I18NLink to="/settings/preserve" activeclassname="active" className="list-group-item">
              <Translate>Preserve</Translate>
              <PreserveIcon />
            </I18NLink>
          </NeedAuthorization>
        </FeatureToggle>
        <FeatureToggle feature="newRelationships">
          <NeedAuthorization roles={['admin']}>
            <I18NLink
              to="/settings/newrelmigration"
              activeclassname="active"
              className="list-group-item"
              no-translate
            >
              New Relationships Migration
            </I18NLink>
          </NeedAuthorization>
        </FeatureToggle>
        <NeedAuthorization roles={['admin']}>
          <I18NLink to="settings/activitylog" activeclassname="active" className="list-group-item">
            <Translate>Activity log</Translate>
          </I18NLink>
          <I18NLink
            to="/settings/customisation"
            activeclassname="active"
            className="list-group-item"
          >
            {allowcustomJS ? (
              <Translate>Global CSS & JS</Translate>
            ) : (
              <Translate>Global CSS</Translate>
            )}
          </I18NLink>
          <I18NLink
            to="/settings/custom-uploads"
            activeclassname="active"
            className="list-group-item"
          >
            <Translate>Uploads</Translate>
          </I18NLink>
        </NeedAuthorization>
        <a
          className="list-group-item"
          href="https://uwazi.io/page/9852italrtk/support"
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

export const mapStateToProps = (state: any) => ({
  allowcustomJS: Boolean(state.settings.collection.get('allowcustomJS')),
});

export const SettingsNavigation = connect(mapStateToProps)(SettingsNavigationComponent);
