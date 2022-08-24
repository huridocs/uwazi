/* eslint-disable max-statements */
/* eslint-disable max-lines */
import React from 'react';
import { Dispatch, bindActionCreators } from 'redux';
import { connect, ConnectedProps } from 'react-redux';
import { Settings } from 'shared/types/settingsType';
import { Translate, t } from 'app/I18N';
import { IStore, ClientTemplateSchema } from 'app/istore';
import { useForm } from 'react-hook-form';
import { actions } from 'app/BasicReducer';
import { notificationActions } from 'app/Notifications';
import { ToggleButton } from 'app/UI';
import { MultiSelect, Geolocation } from 'app/Forms';
import { RequestParams } from 'app/utils/RequestParams';
import SettingsAPI from 'app/Settings/SettingsAPI';
import { FeatureToggle } from 'app/components/Elements/FeatureToggle';
import { validateHomePageRoute } from 'app/utils/routeHelpers';
import { ToggleChildren } from './ToggleChildren';
import * as tips from './collectionSettingsTips';
import { SettingsFormElement } from './SettingsFormElement';

const mapStateToProps = ({ settings, templates }: IStore) => ({
  collectionSettings: settings.collection,
  templates,
});

const mapDispatchToProps = (dispatch: Dispatch<{}>) =>
  bindActionCreators(
    {
      setSettings: actions.set.bind(null, 'settings/collection'),
      notify: notificationActions.notify,
    },
    dispatch
  );

const connector = connect(mapStateToProps, mapDispatchToProps);

type mappedProps = ConnectedProps<typeof connector>;

const CollectionSettings = ({
  collectionSettings,
  templates,
  setSettings,
  notify,
}: mappedProps) => {
  const collectionSettingsObject = collectionSettings.toJS();
  const templatesObject: ClientTemplateSchema[] = templates.toJS();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm({
    defaultValues: collectionSettingsObject,
    mode: 'onSubmit',
  });

  register('private');
  register('openPublicEndpoint');
  register('allowedPublicTemplates');
  register('mapStartingPoint');
  register('cookiepolicy');
  register('newNameGeneration');
  register('ocrServiceEnabled');
  register('home_page', {
    validate: (val: string) => validateHomePageRoute(val) || val === '',
  });
  register('tilesProvider');
  register('mapApiKey', {
    pattern: /^[a-zA-Z0-9._]+$/,
  });

  const save = async (newCollectionSettings: Settings) => {
    const saveParameters = new RequestParams({
      ...collectionSettingsObject,
      ...newCollectionSettings,
      mapApiKey: newCollectionSettings.mapApiKey?.replace(/\s+/g, ' ').trim(),
    });
    const result = await SettingsAPI.save(saveParameters);
    setSettings(result);
    notify(t('System', 'Settings updated', null, false), 'success');
  };
  const year = t('System', 'Year', null, false);
  const month = t('System', 'Month', null, false);
  const day = t('System', 'Day', null, false);

  return (
    <div className="settings-content">
      <div className="panel panel-default collection-settings">
        <form id="collectionSettings" className="" onSubmit={handleSubmit(save)}>
          <div className="panel-heading">
            <Translate>Collection</Translate>
          </div>
          <h2>
            <Translate>General</Translate>
          </h2>

          <SettingsFormElement label="Collection name">
            <input type="text" name="site_name" ref={register} className="form-control" />
          </SettingsFormElement>

          <SettingsFormElement label="Custom favicon" tip={tips.customFavIcon}>
            <ToggleChildren
              toggled={Boolean(watch('favicon'))}
              onToggleOff={() => {
                setValue('favicon', '');
              }}
            >
              <input type="text" name="favicon" ref={register} className="form-control" />
            </ToggleChildren>
          </SettingsFormElement>

          <SettingsFormElement label="Use custom landing page" tip={tips.landingPageTip}>
            <ToggleChildren
              toggled={Boolean(watch('home_page'))}
              onToggleOff={() => {
                setValue('home_page', '');
              }}
            >
              <div className={`input-group ${errors.home_page ? 'has-error' : ''}`}>
                <span className="input-group-addon" id="basic-addon1">
                  <Translate>https://yourdomain</Translate>
                </span>
                <input type="text" className="form-control" name="home_page" ref={register} />
              </div>
              <div className="has-error">
                {errors.home_page && (
                  <div className="error-message">
                    <Translate>Invalid home page url</Translate>
                  </div>
                )}
              </div>
            </ToggleChildren>
          </SettingsFormElement>
          <SettingsFormElement label="Default view">
            <div className="col-xs-12 col-lg-3 col-no-gutters">
              <select name="defaultLibraryView" className="form-control" ref={register}>
                <option value="cards">{t('System', 'Cards', null, false)}</option>
                <option value="table">{t('System', 'Table', null, false)}</option>
                <option value="map">{t('System', 'Map', null, false)}</option>
              </select>
            </div>
          </SettingsFormElement>

          <SettingsFormElement label="Date format">
            <div className="col-xs-12 col-lg-3 col-no-gutters">
              <select name="dateFormat" className="form-control" ref={register}>
                <option value="yyyy/MM/dd">
                  2021/02/26 ({year}, {month}, {day})
                </option>
                <option value="dd/MM/yyyy">
                  26/02/2021 ({day}, {month}, {year})
                </option>
                <option value="MM/dd/yyyy">
                  02/26/2021 ({month}, {day}, {year})
                </option>
                <option value="yyyy-MM-dd">
                  2021-02-26 ({year}, {month}, {day})
                </option>
                <option value="dd-MM-yyyy">
                  26-02-2021 ({day}, {month}, {year})
                </option>
                <option value="MM-dd-yyyy">
                  02-26-2021 ({month}, {day}, {year})
                </option>
              </select>
            </div>
          </SettingsFormElement>

          <SettingsFormElement label="Private instance" tip={tips.publicSharing}>
            <ToggleButton
              checked={Boolean(watch('private'))}
              onClick={() => {
                setValue('private', !getValues('private'));
              }}
            />
          </SettingsFormElement>

          <SettingsFormElement label="Show cookie policy" tip={tips.cookiePolicy}>
            <ToggleButton
              checked={Boolean(watch('cookiepolicy'))}
              onClick={() => {
                setValue('cookiepolicy', !getValues('cookiepolicy'));
              }}
            />
          </SettingsFormElement>

          {!collectionSettingsObject.newNameGeneration && (
            <SettingsFormElement label="Non-latin characters support" tip={tips.characterSupport}>
              <ToggleButton
                checked={Boolean(watch('newNameGeneration'))}
                onClick={() => {
                  setValue('newNameGeneration', !getValues('newNameGeneration'));
                }}
              />
            </SettingsFormElement>
          )}

          <h2>
            <Translate>Website analytics</Translate>
          </h2>

          <SettingsFormElement label="Google Analytics" tip={tips.analytics}>
            <ToggleChildren
              toggled={Boolean(watch('analyticsTrackingId'))}
              onToggleOff={() => {
                setValue('analyticsTrackingId', '');
              }}
            >
              <input
                type="text"
                name="analyticsTrackingId"
                ref={register}
                className="form-control"
              />
            </ToggleChildren>
          </SettingsFormElement>

          <SettingsFormElement label="Matomo Analytics" tip={tips.analytics}>
            <ToggleChildren
              toggled={Boolean(watch('matomoConfig'))}
              onToggleOff={() => {
                setValue('matomoConfig', '');
              }}
            >
              <input type="text" name="matomoConfig" ref={register} className="form-control" />
            </ToggleChildren>
          </SettingsFormElement>

          <FeatureToggle feature="ocr.url">
            <h2>
              <Translate>Services</Translate>
            </h2>

            <SettingsFormElement label="Document OCR trigger" tip={tips.ocrTrigger}>
              <ToggleButton
                checked={Boolean(watch('ocrServiceEnabled'))}
                onClick={() => {
                  setValue('ocrServiceEnabled', !getValues('ocrServiceEnabled'));
                }}
              />
            </SettingsFormElement>
          </FeatureToggle>

          <h2>
            <Translate>Forms and email configuration</Translate>
          </h2>

          <SettingsFormElement label="Contact Form" tip={tips.emails[0]}>
            <ToggleChildren
              toggled={Boolean(watch('contactEmail') || watch('senderEmail'))}
              onToggleOff={() => {
                setValue('contactEmail', '');
                setValue('senderEmail', '');
              }}
            >
              <SettingsFormElement label="Receiving email" tip={tips.emails[1]}>
                <input type="text" ref={register} name="contactEmail" className="form-control" />
              </SettingsFormElement>

              <SettingsFormElement label="Sending email" tip={tips.emails[2]}>
                <input
                  type="text"
                  ref={register}
                  name="senderEmail"
                  placeholder="no-reply@uwazi.io"
                  className="form-control"
                />
              </SettingsFormElement>
            </ToggleChildren>
          </SettingsFormElement>

          <SettingsFormElement label="Public Endpoints" tip={tips.publicForm[0]}>
            <ToggleChildren
              toggled={Boolean(
                (watch('allowedPublicTemplates') || []).length || watch('publicFormDestination')
              )}
              onToggleOff={() => {
                setValue('publicFormDestination', '');
                setValue('allowedPublicTemplates', []);
              }}
            >
              <SettingsFormElement
                label="Public Form submit URL"
                tip={tips.publicForm[1]}
                labelClassName="larger-label"
                inputsClassName="smaller-inputs"
              >
                <input
                  type="text"
                  name="publicFormDestination"
                  ref={register}
                  className="form-control"
                />
              </SettingsFormElement>

              <SettingsFormElement
                label="Whitelisted Templates"
                tip={tips.publicForm[2]}
                labelClassName="larger-label"
                inputsClassName="smaller-inputs"
              >
                <MultiSelect
                  value={watch('allowedPublicTemplates')}
                  options={templatesObject.map(template => ({
                    label: template.name,
                    value: template._id,
                  }))}
                  onChange={newValues => {
                    setValue('allowedPublicTemplates', newValues);
                  }}
                />
              </SettingsFormElement>
            </ToggleChildren>
          </SettingsFormElement>

          <SettingsFormElement label="Allow captcha bypass" tip={tips.openPublicForm}>
            <ToggleButton
              checked={Boolean(watch('openPublicEndpoint'))}
              onClick={() => {
                setValue('openPublicEndpoint', !getValues('openPublicEndpoint'));
              }}
            />
          </SettingsFormElement>

          <h2>
            <Translate>Maps</Translate>
          </h2>
          <SettingsFormElement label="Map provider">
            <div className="col-xs-12 col-lg-3 col-no-gutters">
              <select name="tilesProvider" className="form-control" ref={register}>
                <option value="mapbox">{t('System', 'MapBox', null, false)}</option>
                <option value="google">{t('System', 'Google Maps', null, false)}</option>
              </select>
            </div>
          </SettingsFormElement>
          <div className={`${errors.mapApiKey ? 'has-error' : ''}`}>
            <SettingsFormElement label="Map api key" tip={tips.mapApiKey}>
              <input type="text" name="mapApiKey" ref={register} className="form-control" />
            </SettingsFormElement>
          </div>
          <SettingsFormElement label="Custom starting location" tip={tips.mapAxis}>
            <div className="settings-map">
              <Geolocation
                value={watch('mapStartingPoint')}
                onChange={(values: Settings['mapStartingPoint']) => {
                  setValue('mapStartingPoint', values);
                }}
              />
            </div>
          </SettingsFormElement>
        </form>

        <div className="settings-footer">
          <div className="btn-cluster content-right">
            <button
              type="submit"
              form="collectionSettings"
              className="btn btn-success btn-extra-padding"
            >
              <span className="btn-label">
                <Translate>Save</Translate>
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const container = connector(CollectionSettings);
export { container as CollectionSettings };
