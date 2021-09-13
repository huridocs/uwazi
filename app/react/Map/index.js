import loadable from '@loadable/component';
import * as helper from './helper';

const Map = loadable(async () => import(/* webpackChunkName: "LazyLoadMap" */ './Map.js'));

export { default as Markers } from './Markers.js';
export { helper, Map };
