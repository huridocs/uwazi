import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import moment from 'moment';
import { isClient } from 'app/utils';
import { Link } from 'react-router';
import { RequestParams } from 'app/utils/RequestParams';

import { actions } from 'app/BasicReducer';
import SettingsAPI from 'app/Settings/SettingsAPI';
import { notificationActions } from 'app/Notifications';
import { Geolocation, RadioButtons } from 'app/ReactReduxForms';
import { t, Translate } from 'app/I18N';
import { Icon } from 'UI';
import { LocalForm, Control } from 'react-redux-form';

export class CollectionSettings extends Component {
  static dateFormatSeparatorOptions() {
    return [
      { label: '/', value: '/' },
      { label: '-', value: '-' },
    ];
  }

  static landingPageOptions() {
    return [
      { label: 'Library', value: false },
      { label: 'Custom Page', value: true },
    ];
  }

  static faviconOptions() {
    return [
      { label: "Uwazi's icon", value: 'uwaziIcon' },
      { label: 'Custom icon', value: 'customIcon' },
    ];
  }

  static dateFormatOptions(separator) {
    return [
      { label: 'Year, Month, Day', value: 0, separator },
      { label: 'Day, Month, Year', value: 1, separator },
      { label: 'Month, Day, Year', value: 2, separator },
    ];
  }

  static getDateFormatValue(format, separator) {
    const formatOptions = [
      `yyyy${separator}MM${separator}dd`,
      `dd${separator}MM${separator}yyyy`,
      `MM${separator}dd${separator}yyyy`,
    ];

    return formatOptions.indexOf(format);
  }

  static getDateFormatMoment(value, separator) {
    const formatOptions = [
      `YYYY${separator}MM${separator}DD`,
      `DD${separator}MM${separator}YYYY`,
      `MM${separator}DD${separator}YYYY`,
    ];

    return formatOptions[value];
  }

  static getDateFormatDatePicker(value, separator) {
    const formatOptions = [
      `yyyy${separator}MM${separator}dd`,
      `dd${separator}MM${separator}yyyy`,
      `MM${separator}dd${separator}yyyy`,
    ];

    return formatOptions[value];
  }

  static renderDateFormatLabel(option) {
    const { separator, label, value } = option;
    return (
      <span>
        {label}{' '}
        <code>{moment().format(CollectionSettings.getDateFormatMoment(value, separator))}</code>
      </span>
    );
  }

  static cleanEmptyValues(values) {
    const settings = {};

    if (!values.customLandingpage) {
      settings.home_page = '';
    }

    if (values.customFavicon !== 'customIcon') {
      settings.favicon = '';
    }

    return settings;
  }

  constructor(props, context) {
    super(props, context);
    const { settings } = this.props;
    const dateSeparator =
      props.settings.dateFormat && props.settings.dateFormat.includes('/') ? '/' : '-';
    const dateFormat = CollectionSettings.getDateFormatValue(settings.dateFormat, dateSeparator);
    const customLandingpage = Boolean(props.settings.home_page);
    const customFavicon = !settings.favicon || settings.favicon === '' ? 'uwaziIcon' : 'customIcon';
    const allowedPublicTemplatesString = settings.allowedPublicTemplates
      ? settings.allowedPublicTemplates.join(',')
      : '';
    this.state = {
      ...settings,
      dateSeparator,
      customLandingpage,
      customFavicon,
      dateFormat,
      allowedPublicTemplatesString,
    };
    this.updateSettings = this.updateSettings.bind(this);
  }

  updateSettings(values) {
    let settings = { ...values };
    delete settings.customLandingpage;
    delete settings.dateSeparator;
    delete settings.allowedPublicTemplatesString;
    delete settings.customFavicon;

    settings.dateFormat = CollectionSettings.getDateFormatDatePicker(
      values.dateFormat,
      values.dateSeparator
    );

    settings = { ...settings, ...CollectionSettings.cleanEmptyValues(values) };

    settings.allowedPublicTemplates = values.allowedPublicTemplatesString
      ? values.allowedPublicTemplatesString.split(',')
      : [];

    SettingsAPI.save(new RequestParams(settings)).then(result => {
      const { notify, setSettings } = this.props;
      notify(t('System', 'Settings updated', null, false), 'success');
      setSettings(result);
    });
  }

  render() {
    const hostname = isClient ? window.location.origin : '';
    const { dateSeparator, customLandingpage, customFavicon } = this.state;
    return (
      <div className="panel panel-default">
        <div className="panel-heading">
          <Translate>Collection</Translate>
        </div>
        <div className="panel-body">
          <LocalForm
            id="collectionSettingsForm"
            onSubmit={this.updateSettings}
            initialState={this.state}
            onChange={values => this.setState(values)}
          >
            <div className="form-group">
              <label className="form-group-label" htmlFor="collection_name">
                <Translate>Name</Translate>
              </label>
              <Control.text id="collection_name" model=".site_name" className="form-control" />
            </div>

            <div className="form-group">
              <span className="form-group-label">
                <Translate>Favicon</Translate>
              </span>
              <RadioButtons options={CollectionSettings.faviconOptions()} model=".customFavicon" />
              <div className="input-group">
                <span disabled={customFavicon !== 'customIcon'} className="input-group-addon">
                  {hostname}
                </span>
                <Control.text
                  disabled={customFavicon !== 'customIcon'}
                  model=".favicon"
                  className="form-control"
                />
              </div>
            </div>
            <div className="alert alert-info">
              <Icon icon="star" size="2x" />
              <div className="force-ltr">
                <Translate>
                  Favicon is an icon that appears in the browser tab and bookmarks. If you want to
                  change the Uwazi icon for your own
                </Translate>
                ,
                <br />
                <ul>
                  <li>
                    <Translate>upload it in Custom uploads and copy URL</Translate>
                  </li>
                  <li>
                    <Translate>
                      choose &ldquo;custom icon&rdquo; and paste URL in the field above.
                    </Translate>
                  </li>
                </ul>
                <br />
                <Translate>You will need to reload the page after updating your Favicon.</Translate>
              </div>
            </div>

            <div className="form-group">
              <span className="form-group-label">
                <Translate>Private instance</Translate>
              </span>
              <div className="checkbox">
                <label>
                  <Control.checkbox id="collection_name" model=".private" />
                  <Translate>check as private instance</Translate>
                </label>
              </div>
            </div>
            <div className="form-group">
              <span className="form-group-label">
                <Translate>Date format</Translate>
              </span>
              <div>
                <Translate>Separator</Translate>
              </div>
              <RadioButtons
                options={CollectionSettings.dateFormatSeparatorOptions()}
                model=".dateSeparator"
              />
              <div>
                <Translate>Order</Translate>
              </div>
              <RadioButtons
                options={CollectionSettings.dateFormatOptions(dateSeparator)}
                model=".dateFormat"
                renderLabel={CollectionSettings.renderDateFormatLabel}
              />
            </div>
            <h2>
              <Translate>Advanced settings</Translate>
            </h2>
            <div className="form-group">
              <span className="form-group-label">
                <Translate>Landing page</Translate>
              </span>
              <RadioButtons
                options={CollectionSettings.landingPageOptions()}
                model=".customLandingpage"
              />
              <div className="input-group">
                <span disabled={!customLandingpage} className="input-group-addon">
                  {hostname}
                </span>
                <Control.text
                  disabled={!customLandingpage}
                  model=".home_page"
                  className="form-control"
                />
              </div>
            </div>
            <div className="alert alert-info">
              <Icon icon="home" size="2x" />
              <div className="force-ltr">
                The landing page is the first thing users will see when visiting your Uwazi
                instance.
                <br />
                You can use any URL from your Uwazi instance as a landing page, examples:
                <ul>
                  <li>A page: /page/dicxg0oagy3xgr7ixef80k9</li>
                  <li>Library results: /library/?searchTerm=test</li>
                  <li>An entity: /entity/9htbkgpkyy7j5rk9</li>
                  <li>A document: /document/4y9i99fadjp833di</li>
                </ul>
                Always use URLs relative to your site, starting with / and skipping the
                https://yoursite.com/.
              </div>
            </div>
            <div className="form-group">
              <label className="form-group-label" htmlFor="analyticsTrackingId">
                <Translate>Google Analytics ID</Translate>
              </label>
              <Control.text model=".analyticsTrackingId" className="form-control" />
            </div>
            <div className="form-group">
              <label className="form-group-label" htmlFor="matomoConfig">
                <Translate>Matomo configuration</Translate>
              </label>
              <Control.textarea model=".matomoConfig" className="form-control" rows="5" />
            </div>
            <div className="alert alert-info">
              <Icon icon="question-circle" size="2x" />
              <div className="force-ltr">
                {
                  'This is a JSON configuration object like {"url": "matomo.server.url", "id": "site_id"}.'
                }
              </div>
            </div>
            <div className="form-group">
              <label className="form-group-label" htmlFor="collectionMailerConfig">
                <Translate>Mailer configuration</Translate>
              </label>
              <Control.textarea model=".mailerConfig" className="form-control" rows="5" />
            </div>
            <div className="alert alert-info">
              <Icon icon="envelope" size="2x" />
              <div className="force-ltr">
                This is a JSON configuration object that should match the options values required by
                Nodemailer, as explained in{' '}
                <a href="https://nodemailer.com/smtp/" target="_blank" rel="noopener noreferrer">
                  nodemailer.com/smtp/
                </a>
                <br />
                This setting takes precedence over all other mailer configuration.
                <br />
                If left blank, then the configuration file in /api/config/mailer.js will be used.
              </div>
            </div>
            <div className="form-group">
              <label className="form-group-label" htmlFor="collectionContactEmail">
                <Translate>Contact email</Translate>
              </label>
              <Control.text
                id="collectionContactEmail"
                model=".contactEmail"
                className="form-control"
              />
            </div>
            <div className="form-group">
              <label className="form-group-label" htmlFor="collectionSenderEmail">
                <Translate>Sender email</Translate>
              </label>
              <Control.text
                id="collectionSenderEmail"
                model=".senderEmail"
                className="form-control"
              />
            </div>
            <div className="alert alert-info">
              <div className="force-ltr">
                You can configure the email that will appear as the sender when any email is sent to
                the user. If this email is not set, "no-reply@uwazi.io" will be used instead.
              </div>
            </div>
            <div className="form-group">
              <label className="form-group-label" htmlFor="collectionPublicFormDestination">
                <Translate>Public Form destination</Translate>
              </label>
              <Control.text
                id="collectionPublicFormDestination"
                model=".publicFormDestination"
                className="form-control"
              />
            </div>
            <div className="alert alert-info">
              <div className="force-ltr">
                You can configure the URL of a different Uwazi to receive the submits from your
                Public Form
              </div>
            </div>
            <div className="form-group">
              <label className="form-group-label" htmlFor="collectionAllowedPublicTemplates">
                <Translate>Allowed Public Templates</Translate>
              </label>
              <Control.text
                id="collectionAllowedPublicTemplates"
                model=".allowedPublicTemplatesString"
                className="form-control"
              />
            </div>
            <div className="alert alert-info">
              <div className="force-ltr">
                If you wish to include Public Forms on your pages, you must white-list the template
                IDs for which Public Forms are expected. Please include a comma-separated list of
                tempate IDs without spaces. For example:
                <br />
                5d5b0698e28d130bc98efc8b,5d5d876aa77a121bf9cdd1ff
              </div>
            </div>
            <div className="form-group">
              <label className="form-group-label" htmlFor="mapTilerKey">
                <Translate>MapTiler key</Translate>
              </label>
              <Control.text model=".mapTilerKey" className="form-control" />
              <div className="alert alert-info">
                <div className="force-ltr">You can use your own MapTiler API key</div>
              </div>
            </div>
            <div className="form-group">
              <label className="form-group-label" htmlFor="mapStartingPoint">
                <Translate>Map starting point</Translate>
              </label>
              <Geolocation model=".mapStartingPoint" />
              <div className="alert alert-info">
                <div className="force-ltr">
                  You can set the default starting point for your geolocation properties.
                </div>
              </div>
            </div>
            <span className="form-group-label">
              <Translate>Show Cookie policy</Translate>
            </span>
            <div className="checkbox">
              <label>
                <Control.checkbox model=".cookiepolicy" type="checkbox" />
                <Translate>
                  This option will show a notification about the use of cookies in your instance.
                </Translate>
              </label>
            </div>

            {!this.props.settings.newNameGeneration && (
              <>
                <span className="form-group-label">
                  <Translate>Support non-latin characters in property names</Translate>
                </span>
                <div className="checkbox">
                  <label>
                    <Control.checkbox model=".newNameGeneration" type="checkbox" />
                    <Translate>
                      Checking this box enhances support for non-latin languages as default
                      languages.
                    </Translate>
                  </label>
                  <div className="alert alert-info">
                    <div className="force-ltr">
                      <ul>
                        <li>
                          Checking this box enhances support for non-latin languages as default
                          languages.
                        </li>
                        <li>This will update all template properties automatically.</li>
                        <li>This process could take several minutes.</li>
                        <li>This process will likely change URLs to library filters.</li>
                        <li>
                          If you have menus or links using such URLs, they will probably stop
                          working after the update. You will need to update them manually.
                        </li>
                        <li>
                          After selecting this option, you will not be able to revert back to using
                          legacy property naming.
                        </li>
                        <li>
                          If you are not facing issues with your template property names, we
                          recommend leaving this unchecked.
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </>
            )}
          </LocalForm>
          <h2>
            <Translate>Advanced customizations</Translate>
          </h2>
          <div>
            <Link
              to="/settings/customisation"
              href="/settings/customisation"
              className="btn btn-default"
            >
              <Translate>Custom Styles</Translate>
            </Link>
            &nbsp;
            <Link
              to="/settings/custom-uploads"
              href="/settings/custom-uploads"
              className="btn btn-default"
            >
              <Translate>Custom Uploads</Translate>
            </Link>
          </div>
          <div className="settings-footer">
            <button type="submit" form="collectionSettingsForm" className="btn btn-success">
              <Icon icon="save" />
              <span className="btn-label">
                <Translate>Save</Translate>
              </span>
            </button>
          </div>
        </div>
      </div>
    );
  }
}

CollectionSettings.propTypes = {
  settings: PropTypes.instanceOf(Object).isRequired,
  setSettings: PropTypes.func.isRequired,
  notify: PropTypes.func.isRequired,
};

export function mapStateToProps(state) {
  return { settings: state.settings.collection.toJS() };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      setSettings: actions.set.bind(null, 'settings/collection'),
      notify: notificationActions.notify,
    },
    dispatch
  );
}

export default connect(mapStateToProps, mapDispatchToProps)(CollectionSettings);
