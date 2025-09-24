/* eslint-disable react/jsx-props-no-spreading */
import loadable from '@loadable/component';
import React from 'react';
// @ts-expect-error TS(2307): Cannot find module '../../Map/MapContainer.js' or ... Remove this comment to see the full error message
import { Map, Layer } from '../../Map/MapContainer.js';
import * as helper from './helper';

const LMap = loadable(async () => {
  const { LMap: LMapComponent } = await import(/* webpackChunkName: "LazyLoadMap" */ './LMap');
  return (props: any) => <LMapComponent {...props} />;
});

export { default as Markers } from './Markers';
export { helper, LMap, Map };
export type { Layer };
