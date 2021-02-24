import React from 'react';
import { ToggleChildren } from './ToggleChildren';

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
  <ToggleChildren toggled={false}>
    <p>TEST</p>
    <input type="text" />
    <h1>TEST 2</h1>
  </ToggleChildren>
);
