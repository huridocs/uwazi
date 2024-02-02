import Jvent from 'jvent';
import rison from 'rison-node';

export function getPropsFromRoute({ routes }, componentProps) {
  const props = {};
  const lastRoute = routes[routes.length - 1];

  routes.reduceRight((_prevRoute, currRoute) => {
    componentProps.forEach(componentProp => {
      if (!props[componentProp] && currRoute.component && currRoute.component[componentProp]) {
        props[componentProp] = currRoute.component[componentProp];
      }
    });
  }, lastRoute);

  return props;
}

export function risonDecodeOrIgnore(query, defaultValue = {}) {
  try {
    return rison.decode(query);
  } catch (e) {
    console.log('Error decoding: ', query, e);
    return defaultValue;
  }
}

export const isClient = typeof document !== 'undefined';
export const events = new Jvent();
