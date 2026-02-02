/* eslint-disable react/jsx-props-no-spreading */
import loadable from '@loadable/component';
import React from 'react';

import { Map, Layer } from './MapContainer.js';
import * as helper from './helper.js';

const LMap = loadable(async () => {
  const { LMap: LMapComponent } = await import(/* webpackChunkName: "LazyLoadMap" */ './LMap.js');
  return (props: any) => <LMapComponent {...props} />;
});

export { default as Markers } from './Markers.js';
export { helper, LMap, Map };
export type { Layer };
