import { act, cloneElement, isValidElement } from 'react';
import Enzyme, { ReactWrapper, ShallowWrapper } from 'enzyme';

const origShallow = Enzyme.shallow.bind(Enzyme);
const origDive = ShallowWrapper.prototype.dive;

const storeFromProps = props => {
  if (props?.store?.getState) {
    return props.store;
  }
  if (props?.value?.store?.getState) {
    return props.value.store;
  }
  return undefined;
};

const storeFromWrapper = wrapper =>
  storeFromProps(wrapper.props()) ||
  (wrapper.parents().length ? storeFromProps(wrapper.parent().props()) : undefined);

const injectStore = (node, options) => {
  const store = options?.context?.store;
  if (!store || !isValidElement(node) || node.props.store != null) {
    return node;
  }
  return cloneElement(node, { store });
};

const isConnectType = type =>
  typeof type === 'function' &&
  Boolean(type.WrappedComponent || /^(Connect(ed)?\()/.test(type.displayName || ''));

const unwrapConnectProvider = wrapper => {
  if (wrapper.length !== 1) {
    return wrapper;
  }
  if (wrapper.name() === 'ContextProvider' && wrapper.children().length === 1) {
    return wrapper.childAt(0);
  }
  return wrapper;
};

const isReduxProvider = node =>
  node?.type?.displayName === 'Provider' || node?.type?.name === 'Provider';

const configureEnzymeReact19 = () => {
  Enzyme.shallow = (node, options = {}) => {
    const wrapper = origShallow(injectStore(node, options), options);
    return isReduxProvider(node) ? wrapper : unwrapConnectProvider(wrapper);
  };

  ShallowWrapper.prototype.dive = function dive(options = {}) {
    const store = options.context?.store || storeFromWrapper(this);
    const nextOptions = store ? { ...options, context: { ...options.context, store } } : options;
    if (this.children().length === 1) {
      const child = this.childAt(0).getElement();
      if (isConnectType(child?.type)) {
        return Enzyme.shallow(child, nextOptions);
      }
    }
    return origDive.call(this, nextOptions);
  };

  const origSimulate = ReactWrapper.prototype.simulate;
  ReactWrapper.prototype.simulate = function simulate(event, mock) {
    const handlerName = `on${event.charAt(0).toUpperCase()}${event.slice(1)}`;
    const handler = this.prop(handlerName);
    if (typeof handler === 'function') {
      act(() => {
        handler(mock || { preventDefault() {} });
      });
      this.root().update();
      return this;
    }
    return origSimulate.call(this, event, mock);
  };
};

export { configureEnzymeReact19 };
