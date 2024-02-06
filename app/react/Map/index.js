import loadable from '@loadable/component';
import React from 'react';
import { Map, Layer } from 'app/Map/MapContainer';
import * as helper from './helper';

const LMap = loadable(async () => {
  const { LMap: LMapComponent } = await import(/* webpackChunkName: "LazyLoadMap" */ './LMap.tsx');
  return props => <LMapComponent {...props} />;
});

export { default as Markers } from './Markers.js';
export { helper, LMap, Map, Layer };
