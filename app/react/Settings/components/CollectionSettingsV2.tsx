import React from 'react';
import { Dispatch, bindActionCreators } from 'redux';
import { connect, ConnectedProps } from 'react-redux';
import { Settings } from 'shared/types/settingsType';
import { Tip } from 'app/Layout';
import { Translate, t } from 'app/I18N';
import { IStore, ClientTemplateSchema } from 'app/istore';
import { useForm } from 'react-hook-form';
import { actions } from 'app/BasicReducer';
import { notificationActions } from 'app/Notifications';
import { ToggleButton } from 'app/UI';
import { MultiSelect, Geolocation } from 'app/Forms';

import { ToggleChildren } from './ToggleChildren';
import { SettingsLabel } from './SettingsLabel';
import * as CollectionSettingsTips from './collectionSettingsTips';

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

  const save = (newCollectionSettings: Settings) => {
    console.log({ ...collectionSettingsObject, ...newCollectionSettings });
    setSettings({ ...collectionSettingsObject, ...newCollectionSettings });
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

        <div className="form-element">
          <SettingsLabel>
            <Translate>Collection name</Translate>
          </SettingsLabel>
          <input type="text" name="site_name" ref={register} />
        </div>

        <div className="form-element">
          <SettingsLabel>
            <Translate>Custom favicon</Translate>
            <Tip icon="info-circle">{CollectionSettingsTips.customFavIcon}</Tip>
          </SettingsLabel>
          <ToggleChildren toggled={false}>
            <input type="text" name="favicon" ref={register} />
          </ToggleChildren>
        </div>

        <div className="form-element">
          <SettingsLabel>
            <Translate>Use custom landing page</Translate>
            <Tip icon="info-circle">{CollectionSettingsTips.landingPageTip}</Tip>
          </SettingsLabel>
          <ToggleChildren
            toggled={Boolean(watch('home_page'))}
            onToggleOff={() => {
              setValue('home_page', '');
            }}
          >
            <input type="text" name="home_page" ref={register} />
          </ToggleChildren>
        </div>

        <div className="form-element">
          <SettingsLabel>
            <Translate>Default view</Translate>
          </SettingsLabel>
          <select name="defaultLibraryView" className="selector" ref={register}>
            <option value="cards">Cards</option>
            <option value="table">Table</option>
            <option value="map">Map</option>
          </select>
        </div>

        <div className="form-element">
          <SettingsLabel>
            <Translate>Date format</Translate>
          </SettingsLabel>
          <div>
            <select name="dateFormat" className="selector" ref={register}>
              <option value="yyyy/MM/dd">2021/02/26 (Year, Month, Day)</option>
              <option value="dd/MM/yyyy">26/02/2021 (Day, Month, Year)</option>
              <option value="MM/dd/yyyy">02/26/2021 (Month, Day, Year)</option>
              <option value="yyyy-MM-dd">2021-02-26 (Year, Month, Day)</option>
              <option value="dd-MM-yyyy">26-02-2021 (Day, Month, Year)</option>
              <option value="MM-dd-yyyy">02-26-2021 (Month, Day, Year)</option>
            </select>
          </div>
        </div>

        <div className="form-element" id="form-property-private">
          <SettingsLabel>
            <Translate>Private Instance</Translate>
            <Tip icon="info-circle">{CollectionSettingsTips.publicSharing}</Tip>
          </SettingsLabel>
          <ToggleButton
            checked={Boolean(watch('private'))}
            onClick={() => {
              setValue('private', !getValues('private'));
            }}
          />
        </div>

        <div className="form-element">
          <SettingsLabel>
            <Translate>Show cookie policy</Translate>
            <Tip icon="info-circle">{CollectionSettingsTips.cookiePolicy}</Tip>
          </SettingsLabel>
          <ToggleChildren toggled={false} />
        </div>

        <div className="form-element">
          <SettingsLabel>
            <Translate>Non-latin characters support</Translate>
            <Tip icon="info-circle">{CollectionSettingsTips.characterSupport}</Tip>
          </SettingsLabel>
          <ToggleChildren toggled={false} />
        </div>

        <h2>
          <Translate>Website analytics</Translate>
        </h2>

        <div className="form-element">
          <SettingsLabel>
            <Translate>Google Analytics</Translate>
            <Tip icon="info-circle">{CollectionSettingsTips.analytics}</Tip>
          </SettingsLabel>
          <ToggleChildren toggled={false}>
            <input type="text" />
          </ToggleChildren>
        </div>

        <div className="form-element">
          <SettingsLabel>
            <Translate>Motomo Analytics</Translate>
            <Tip icon="info-circle">{CollectionSettingsTips.analytics}</Tip>
          </SettingsLabel>
          <ToggleChildren toggled={false}>
            <input type="text" />
          </ToggleChildren>
        </div>

        <h2>
          <Translate>Forms and email configuration</Translate>
        </h2>
        <div className="form-element" id="public-enpoints">
          <SettingsLabel>
            <Translate>Public Endpoints</Translate>
            <Tip icon="info-circle">{CollectionSettingsTips.publicForm}</Tip>
          </SettingsLabel>
          <ToggleChildren
            toggled={Boolean(
              (watch('allowedPublicTemplates') || []).length || watch('publicFormDestination')
            )}
            onToggleOff={() => {
              setValue('publicFormDestination', '');
              setValue('allowedPublicTemplates', []);
            }}
          >
            <div>
              <SettingsLabel>
                <Translate>Public Form destination URL</Translate>
                <Tip icon="info-circle">{CollectionSettingsTips.publicForm}</Tip>
              </SettingsLabel>
              <input type="text" name="publicFormDestination" ref={register} />
            </div>
            <div>
              <SettingsLabel>
                <Translate>Whitelisted Templates</Translate>
                <Tip icon="info-circle">{CollectionSettingsTips.publicForm}</Tip>
              </SettingsLabel>
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
            </div>
          </ToggleChildren>
        </div>

        <h2>
          <Translate>Maps</Translate>
        </h2>
        <div className="form-element">
          <SettingsLabel>
            <Translate>Custom starting location</Translate>
            <Tip icon="info-circle">{CollectionSettingsTips.mapAxis}</Tip>
          </SettingsLabel>
          <Geolocation
            onChange={(values: Settings['mapStartingPoint']) => {
              setValue('mapStartingPoint', values);
            }}
          />
        </div>
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
