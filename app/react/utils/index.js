import Jvent from 'jvent';
import rison from '@huridocs/rison';
import { captureException } from '@sentry/react';

const getPropsFromRoute = ({ routes }, componentProps) => {
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
};

const risonDecodeOrIgnore = (query, defaultValue = {}) => {
  try {
    return rison.decode(query);
  } catch (e) {
    const error = new Error(`Error decoding ${query}`, { cause: e });
    captureException(error);
    return defaultValue;
  }
};

const isClient = typeof document !== 'undefined';
const events = new Jvent();

export { isClient, events, risonDecodeOrIgnore, getPropsFromRoute };
