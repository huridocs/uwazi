import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import moment from 'moment';
import { isClient } from 'app/utils';
import { Link } from 'react-router';

import { actions } from 'app/BasicReducer';
import SettingsAPI from 'app/Settings/SettingsAPI';
import { notify } from 'app/Notifications/actions/notificationsActions';
import { RadioButtons } from 'app/ReactReduxForms';
import { t, Translate } from 'app/I18N';
import { Icon } from 'UI';
import { LocalForm, Control } from 'react-redux-form';

export class CollectionSettings extends Component {
  static dateFormatSeparatorOptions() {
    return [
      { label: '/', value: '/' },
      { label: '-', value: '-' }
    ];
  }

  static landingPageOptions() {
    return [
      { label: 'Library', value: false },
      { label: 'Custom Page', value: true }
    ];
  }

  static dateFormatOptions(separator) {
    return [
      { label: 'Year, Month, Day', value: 0, separator },
      { label: 'Day, Month, Year', value: 1, separator },
      { label: 'Month, Day, Year', value: 2, separator }
    ];
  }

  static getDateFormatValue(format, separator) {
    const formatOptions = [
      `YYYY${separator}MM${separator}DD`,
      `DD${separator}MM${separator}YYYY`,
      `MM${separator}DD${separator}YYYY`
    ];

    return formatOptions.indexOf(format);
  }

  static getDateFormat(value, separator) {
    const formatOptions = [
      `YYYY${separator}MM${separator}DD`,
      `DD${separator}MM${separator}YYYY`,
      `MM${separator}DD${separator}YYYY`
    ];

    return formatOptions[value];
  }

  static renderDateFormatLabel(option) {
    const { separator, label, value } = option;
    return <span>{label} <code>{moment().format(CollectionSettings.getDateFormat(value, separator))}</code></span>;
  }

  constructor(props, context) {
    super(props, context);
    const { settings } = this.props;
    const dateSeparator = props.settings.dateFormat && props.settings.dateFormat.includes('/') ? '/' : '-';
    const dateFormat = CollectionSettings.getDateFormatValue(settings.dateFormat, dateSeparator);
    const customLandingpage = Boolean(props.settings.home_page);
    this.state = Object.assign({}, settings, { dateSeparator, customLandingpage, dateFormat });
    this.updateSettings = this.updateSettings.bind(this);
  }

  updateSettings(values) {
    const settings = Object.assign({}, values);
    delete settings.customLandingpage;
    delete settings.dateSeparator;
    settings.dateFormat = CollectionSettings.getDateFormat(values.dateFormat, values.dateSeparator);

    if (!values.customLandingpage) {
      settings.home_page = '';
    }

    SettingsAPI.save(settings)
    .then((result) => {
      this.props.notify(t('System', 'Settings updated', null, false), 'success');
      this.props.setSettings(result);
    });
  }

  render() {
    const hostname = isClient ? window.location.origin : '';
    return (
      <div className="panel panel-default">
        <div className="panel-heading">{t('System', 'Collection')}</div>
        <div className="panel-body">
          <LocalForm id="collectionSettingsForm" onSubmit={this.updateSettings} initialState={this.state} onChange={values => this.setState(values)}>
            <div className="form-group">
              <label className="form-group-label" htmlFor="collection_name">{t('System', 'Name')}</label>
              <Control.text id="collection_name" model=".site_name" className="form-control"/>
            </div>
            <div className="form-group">
              <span className="form-group-label">{t('System', 'Private instance')}</span>
              <div className="checkbox">
                <label>
                  <Control.checkbox id="collection_name" model=".private"/>
                  {t('System', 'check as private instance')}
                </label>
              </div>
            </div>
            <div className="form-group">
              <span className="form-group-label">{t('System', 'Date format')}</span>
              <div>{t('System', 'Separator')}</div>
              <RadioButtons
                options={CollectionSettings.dateFormatSeparatorOptions()}
                model=".dateSeparator"
              />
              <div>{t('System', 'Order')}</div>
              <RadioButtons
                options={CollectionSettings.dateFormatOptions(this.state.dateSeparator)}
                model=".dateFormat"
                renderLabel={CollectionSettings.renderDateFormatLabel}
              />
            </div>
            <h2>{t('System', 'Advanced settings')}</h2>
            <div className="form-group">
              <span className="form-group-label">{t('System', 'Landing page')}</span>
              <RadioButtons
                options={CollectionSettings.landingPageOptions()}
                model=".customLandingpage"
              />
              <div className="input-group">
                <span disabled={!this.state.customLandingpage} className="input-group-addon">
                  {hostname}
                </span>
                <Control.text
                  disabled={!this.state.customLandingpage}
                  model=".home_page"
                  className="form-control"
                />
              </div>
            </div>
            <div className="alert alert-info">
              <Icon icon="home" size="2x" />
              <div className="force-ltr">
                The landing page is the first thing users will see when visiting your Uwazi instance.<br />
                You can use any URL from your Uwazi instance as a landing page, examples:
                <ul>
                  <li>A page: /page/dicxg0oagy3xgr7ixef80k9</li>
                  <li>Library results: /library/?searchTerm=test</li>
                  <li>An entity: /entity/9htbkgpkyy7j5rk9</li>
                  <li>A document: /document/4y9i99fadjp833di</li>
                </ul>
                Always use URLs relative to your site, starting with / and skipping the https://yoursite.com/.
              </div>
            </div>
            <div className="form-group">
              <label className="form-group-label" htmlFor="analyticsTrackingId">{t('System', 'Google Analytics ID')}</label>
              <Control.text
                model=".analyticsTrackingId"
                className="form-control"
              />
            </div>
            <div className="form-group">
              <label className="form-group-label" htmlFor="matomoConfig">{t('System', 'Matomo configuration')}</label>
              <Control.textarea
                model=".matomoConfig"
                className="form-control"
                rows="5"
              />
            </div>
            <div className="alert alert-info">
              <Icon icon="question-circle" size="2x" />
              <div className="force-ltr">
                {'This is a JSON configuration object like {"url": "matomo.server.url", "id": "site_id"}.'}
              </div>
            </div>
            <div className="form-group">
              <label className="form-group-label" htmlFor="collectionMailerConfig">{t('System', 'Mailer configuration')}</label>
              <Control.textarea
                model=".mailerConfig"
                className="form-control"
                rows="5"
              />
            </div>
            <div className="alert alert-info">
              <Icon icon="envelope" size="2x" />
              <div className="force-ltr">
                This is a JSON configuration object that should match the options values required by Nodemailer,
                as explained in <a href="https://nodemailer.com/smtp/" target="_blank">nodemailer.com/smtp/</a><br />
                This setting takes precedence over all other mailer configuration.<br />
                If left blank, then the configuration file in /api/config/mailer.js will be used.
              </div>
            </div>
            <div className="form-group">
              <label className="form-group-label" htmlFor="collectionContactEmail">{t('System', 'Contact email')}</label>
              <Control.text
                model=".contactEmail"
                className="form-control"
              />
            </div>
            <div className="form-group">
              <label className="form-group-label" htmlFor="collectionContactEmail">{t('System', 'Public Form destination')}</label>
              <Control.text
                model=".publicFormDestination"
                className="form-control"
              />
            </div>
            <div className="alert alert-info">
              <div className="force-ltr">
                You can configure the URL of a different Uwazi to receive the submits from your Public Form
              </div>
            </div>
            <span className="form-group-label" >{t('System', 'Show Cookie policy')}</span>
            <div className="checkbox">
              <label>
                <Control.checkbox
                  model=".cookiepolicy"
                  type="checkbox"
                />
                <Translate>This option will show a notification about the use of cookies in your instance.</Translate>
              </label>
            </div>
          </LocalForm>
          <h2>{t('System', 'Advanced customizations')}</h2>
          <div>
            <Link
              to="/settings/customisation"
              href="/settings/customisation"
              className="btn btn-default"
            >
              {t('System', 'Custom Styles')}
            </Link>
            &nbsp;
            <Link
              to="/settings/custom-uploads"
              href="/settings/custom-uploads"
              className="btn btn-default"
            >
              {t('System', 'Custom Uploads')}
            </Link>
          </div>
          <div className="settings-footer">
            <button type="submit" form="collectionSettingsForm" className="btn btn-success">
              <Icon icon="save" />
              <span className="btn-label">{t('System', 'Save')}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }
}

CollectionSettings.propTypes = {
  settings: PropTypes.object.isRequired,
  setSettings: PropTypes.func.isRequired,
  notify: PropTypes.func.isRequired
};

export function mapStateToProps(state) {
  return { settings: state.settings.collection.toJS() };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ setSettings: actions.set.bind(null, 'settings/collection'), notify }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(CollectionSettings);
