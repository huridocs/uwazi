import React from 'react';
import { Tip } from 'app/Layout';
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
  <div className="collection-settings">
    <h1>Collection</h1>
    <h2>General</h2>
    <div>
      <SettingsLabel>
        <span>Use custom landing page</span>
        <Tip>{CollectionSettingsTips.landingPageTip}</Tip>
      </SettingsLabel>
      <ToggleChildren toggled={false}>
        <input type="text" />
      </ToggleChildren>
    </div>
  </div>
);
