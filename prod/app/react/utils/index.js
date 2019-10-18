"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.getPropsFromRoute = getPropsFromRoute;exports.events = exports.isClient = void 0;var _jvent = _interopRequireDefault(require("jvent"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

function getPropsFromRoute({ routes }, componentProps) {
  const props = {};
  const lastRoute = routes[routes.length - 1];

  routes.reduceRight((prevRoute, currRoute) => {
    componentProps.forEach(componentProp => {
      if (!props[componentProp] && currRoute.component && currRoute.component[componentProp]) {
        props[componentProp] = currRoute.component[componentProp];
      }
    });
  }, lastRoute);

  return props;
}

const isClient = typeof document !== 'undefined';exports.isClient = isClient;
const events = new _jvent.default();exports.events = events;