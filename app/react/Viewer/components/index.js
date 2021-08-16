import loadable from '@loadable/component';
const Document = loadable(async () =>
  import(/* webpackChunkName: "LazyLoadDocument" */ './Document.js')
);

export { Document };
