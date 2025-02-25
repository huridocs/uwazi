import Jvent from 'jvent';
import rison from 'rison-node';

const logger = console.log;

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
    console.log = () => {};
    return rison.decode(query);
  } catch (e) {
    // silently failing until https://github.com/huridocs/Internal-Issues/issues/266 can be solved
    // console.log('Error decoding: ', query, e);
    return defaultValue;
  } finally {
    // silence the console.log until we can fix the error mentioned above
    // to avoid rison throwing console.logs
    console.log = logger;
  }
}

export const isClient = typeof document !== 'undefined';
export const events = new Jvent();
