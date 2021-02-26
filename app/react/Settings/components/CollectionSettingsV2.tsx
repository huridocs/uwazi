import React from 'react';
import { Tip } from 'app/Layout';
import { Translate } from 'app/I18N';
import { ToggleChildren } from './ToggleChildren';
import { SettingsLabel } from './SettingsLabel';
import * as CollectionSettingsTips from './collectionSettingsTips';

// <SettingProperty>
//   <Label>
//     <span>Use custom landing page</span>
//     <Tooltip>flasdkjf ldkjads;lfkjdsf;lakdsj f;adlsfkj</Tooltip>
//   </Label>

//   <ToggleChildren toggled={false}>
//     <input model={}></input>
//   </ToggleChildren>
// </SettingProperty>

export const CollectionSettings = () => (
  <div className="panel panel-default collection-settings">
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
      <input type="text" />
    </div>

    <div className="form-element">
      <SettingsLabel>
        <Translate>Custom favicon</Translate>
        <Tip icon="info-circle">{CollectionSettingsTips.customFavIcon}</Tip>
      </SettingsLabel>
    </div>

    <div className="form-element">
      <SettingsLabel>
        <Translate>Use custom landing page</Translate>
        <Tip icon="info-circle">{CollectionSettingsTips.landingPageTip}</Tip>
      </SettingsLabel>
      <ToggleChildren toggled={false}>
        <input type="text" />
      </ToggleChildren>
    </div>

    <div className="form-element">
      <SettingsLabel>
        <Translate>Default view</Translate>
      </SettingsLabel>
    </div>

    <div className="form-element">
      <SettingsLabel>
        <span>Date format</span>
      </SettingsLabel>
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
  </div>
);
