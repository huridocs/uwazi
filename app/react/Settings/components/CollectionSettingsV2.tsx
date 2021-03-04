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

  const { register, handleSubmit, watch, setValue, getValues } = useForm({
    defaultValues: collectionSettingsObject,
  });

  register('private');
  register('allowedPublicTemplates');
  register('mapStartingPoint');
  register('cookiepolicy');
  register('newNameGeneration');

  const save = async (newCollectionSettings: Settings) => {
    const saveParameters = new RequestParams({
      ...collectionSettingsObject,
      ...newCollectionSettings,
    });
    const result = await SettingsAPI.save(saveParameters);
    setSettings(result);
    notify(t('System', 'Settings updated', null, false), 'success');
  };

  return (
    <div className="panel panel-default collection-settings">
      <form id="collectionSettings" className="" onSubmit={handleSubmit(save)}>
        <div className="panel-heading">
          <Translate>Collection</Translate>
        </div>
        <h2>
          <Translate>General</Translate>
        </h2>

        <SettingsFormElement label="Collection name">
          <input type="text" name="site_name" ref={register} />
        </SettingsFormElement>

        <SettingsFormElement label="Custom favicon" tip={tips.customFavIcon}>
          <ToggleChildren
            toggled={Boolean(watch('favicon'))}
            onToggleOff={() => {
              setValue('favicon', '');
            }}
          >
            <input type="text" name="favicon" ref={register} />
          </ToggleChildren>
        </SettingsFormElement>

        <SettingsFormElement label="Use custom landing page" tip={tips.landingPageTip}>
          <ToggleChildren
            toggled={Boolean(watch('home_page'))}
            onToggleOff={() => {
              setValue('home_page', '');
            }}
          >
            <input type="text" name="home_page" ref={register} />
          </ToggleChildren>
        </SettingsFormElement>

        <SettingsFormElement label="Default view">
          <select name="defaultLibraryView" className="selector" ref={register}>
            <option value="cards">Cards</option>
            <option value="table">Table</option>
            <option value="map">Map</option>
          </select>
        </SettingsFormElement>

        <SettingsFormElement label="Date format">
          <select name="dateFormat" className="selector" ref={register}>
            <option value="yyyy/MM/dd">2021/02/26 (Year, Month, Day)</option>
            <option value="dd/MM/yyyy">26/02/2021 (Day, Month, Year)</option>
            <option value="MM/dd/yyyy">02/26/2021 (Month, Day, Year)</option>
            <option value="yyyy-MM-dd">2021-02-26 (Year, Month, Day)</option>
            <option value="dd-MM-yyyy">26-02-2021 (Day, Month, Year)</option>
            <option value="MM-dd-yyyy">02-26-2021 (Month, Day, Year)</option>
          </select>
        </SettingsFormElement>

        <SettingsFormElement label="Private Instance" tip={tips.publicSharing}>
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
            <input type="text" name="analyticsTrackingId" ref={register} />
          </ToggleChildren>
        </SettingsFormElement>

        <SettingsFormElement label="Motomo Analytics" tip={tips.analytics}>
          <ToggleChildren
            toggled={Boolean(watch('matomoConfig'))}
            onToggleOff={() => {
              setValue('matomoConfig', '');
            }}
          >
            <input type="text" name="matomoConfig" ref={register} />
          </ToggleChildren>
        </SettingsFormElement>

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
              <input type="text" ref={register} name="contactEmail" />
            </SettingsFormElement>

            <SettingsFormElement label="Sending email" tip={tips.emails[2]}>
              <input
                type="text"
                ref={register}
                name="senderEmail"
                placeholder="no-reply@uwazi.io"
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
            <SettingsFormElement label="Public Form destination URL" tip={tips.publicForm[1]}>
              <input type="text" name="publicFormDestination" ref={register} />
            </SettingsFormElement>

            <SettingsFormElement label="Whitelisted Templates" tip={tips.publicForm[2]}>
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

        <h2>
          <Translate>Maps</Translate>
        </h2>

        <SettingsFormElement label="Custom starting location" tip={tips.mapAxis}>
          <Geolocation
            onChange={(values: Settings['mapStartingPoint']) => {
              setValue('mapStartingPoint', values);
            }}
          />
        </SettingsFormElement>

        <SettingsFormElement label="MapTiler key" tip={tips.mapTiler}>
          <input type="text" name="mapTilerKey" ref={register} placeholder="Enter your API key" />
        </SettingsFormElement>

        <div>
          <button type="submit" className="btn btn-success">
            <Translate>Save</Translate>
          </button>
        </div>
      </form>
    </div>
  );
};

const container = connector(CollectionSettings);
export { container as CollectionSettings };
