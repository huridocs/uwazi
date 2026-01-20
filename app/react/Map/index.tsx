/* eslint-disable react/jsx-props-no-spreading */
import loadable from '@loadable/component';
import React from 'react';

import { Map, Layer } from '#app/Map/MapContainer.jsx';
import * as helper from '#app/Map/helper.js';

const LMap = loadable(async () => {
  const { LMap: LMapComponent } = await import(/* webpackChunkName: "LazyLoadMap" */ './LMap');
  return (props: any) => <LMapComponent {...props} />;
});

export { default as Markers } from '#app/Map/Markers.js';
export { helper, LMap, Map };
export type { Layer };
