import React, { useState } from 'react';
import { Tip } from 'app/Layout';
import { Translate, t } from 'app/I18N';
import { useForm } from 'react-hook-form';
import { connect, ConnectedProps } from 'react-redux';
import { Dispatch, bindActionCreators } from 'redux';
import { IStore } from 'app/istore';
import { Settings } from 'shared/types/settingsType';

import { actions } from 'app/BasicReducer';
import { notificationActions } from 'app/Notifications';
import { ToggleChildren } from './ToggleChildren';
import { SettingsLabel } from './SettingsLabel';
import * as CollectionSettingsTips from './collectionSettingsTips';

interface ToggledStatus {
  /* eslint-disable camelcase */
  home_page?: boolean;
  /* eslint-enable camelcase */
}

const mapStateToProps = ({ settings }: IStore) => ({ collectionSettings: settings.collection });

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

const CollectionSettings = ({ collectionSettings, setSettings, notify }: mappedProps) => {
  const toggledStatusDefaults: ToggledStatus = {};

  const [dateSeparator, setDateSeparator] = useState('-');
  const [toggledStatus, setToggledStatus] = useState(toggledStatusDefaults);

  const collectionSettingsObject = collectionSettings.toJS();

  const save = (newCollectionSettings: Settings) => {
    console.log({ ...collectionSettingsObject, ...newCollectionSettings });
    setSettings({ ...collectionSettingsObject, ...newCollectionSettings });
    notify(t('System', 'Settings updated', null, false), 'success');
  };

  const { register, handleSubmit, watch, setValue } = useForm({
    defaultValues: collectionSettingsObject,
  });

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
            <ToggleChildren toggled={false}>
              <input type="text" name="favicon" ref={register} />
            </ToggleChildren>
          </SettingsLabel>
        </div>

        <div className="form-element">
          <SettingsLabel>
            <Translate>Use custom landing page</Translate>
            <Tip icon="info-circle">{CollectionSettingsTips.landingPageTip}</Tip>
          </SettingsLabel>
          {/* <ToggleButton
            checked={Boolean(watch('home_page'))}
            onClick={() => {
              setValue('home_page', '');
            }}
          />

          <input type="text" name="home_page" ref={register} /> */}
          <ToggleChildren
            toggled={Boolean(toggledStatus.home_page || watch('home_page'))}
            onToggleOn={() => {
              setToggledStatus({ ...toggledStatus, home_page: true });
            }}
            onToggleOff={() => {
              setValue('home_page', '');
              setToggledStatus({ ...toggledStatus, home_page: false });
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
            <option value="cards">Card view</option>
            <option value="list">List view</option>
          </select>
        </div>

        <div className="form-element">
          <SettingsLabel>
            <Translate>Date format</Translate>
          </SettingsLabel>
          <div>
            <Translate>Separator</Translate>
            <select
              className="selector"
              onChange={event => {
                setDateSeparator(event.target.value);
              }}
              defaultValue="-"
            >
              <option value="-">-</option>
              <option value="/">/</option>
            </select>
            <Translate>Format</Translate>
            <select name="dateFormat" className="selector" ref={register}>
              <option value={`yyyy${dateSeparator}MM${dateSeparator}dd`}>
                Year, Month, Day 2021{`${dateSeparator}`}02{`${dateSeparator}`}26
              </option>
              <option value={`dd${dateSeparator}MM${dateSeparator}yyyy`}>
                Day, Month, Year 26{`${dateSeparator}`}02{`${dateSeparator}`}2021
              </option>
              <option value={`MM${dateSeparator}dd${dateSeparator}YYYY`}>
                Month, Day, Year 02{`${dateSeparator}`}26{`${dateSeparator}`}2021
              </option>
            </select>
          </div>
        </div>

        <div className="form-element">
          <SettingsLabel>
            <Translate>Allow public sharing</Translate>
            <Tip icon="info-circle">{CollectionSettingsTips.publicSharing}</Tip>
          </SettingsLabel>
          <ToggleChildren toggled={false} />
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
          <Translate>Form and email configuration</Translate>
        </h2>

        <h2>
          <Translate>Maps</Translate>
        </h2>
        <div className="form-element">
          <SettingsLabel>
            <Translate>Set starting location</Translate>
            <Tip icon="info-circle">{CollectionSettingsTips.mapAxis}</Tip>
          </SettingsLabel>
          <ToggleChildren toggled={false}>
            <Translate>Longitude</Translate>
            <input type="text" />
            <Translate>Latitude</Translate>
            <input type="text" />
          </ToggleChildren>
        </div>
        <button type="submit" className="btn btn-success">
          <Translate>Save</Translate>
        </button>
      </form>
    </div>
  );
};

const container = connector(CollectionSettings);
export { container as CollectionSettings };
