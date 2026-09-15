/* eslint-disable import/no-extraneous-dependencies */
import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';
import AdapterModule from '@belzile/enzyme-adapter-react-19';
import Enzyme from 'enzyme';
import * as ReactDOM from 'react-dom';
import { MessageChannel } from 'node:worker_threads';
import { configureEnzymeReact19 } from './setUpEnzymeReact19.js';

const findDOMNode = component => {
  if (component == null) {
    return null;
  }
  if (component.nodeType === 1 || component.nodeType === 3) {
    return component;
  }
  let fiber = component._reactInternals || component._reactInternalFiber;
  while (fiber) {
    if (fiber.stateNode && fiber.stateNode.nodeType === 1) {
      return fiber.stateNode;
    }
    fiber = fiber.child;
  }
  return null;
};

ReactDOM.findDOMNode = findDOMNode;
if (ReactDOM.default) {
  ReactDOM.default.findDOMNode = findDOMNode;
}

Object.assign(global, { TextDecoder, TextEncoder });
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
if (typeof globalThis.MessageChannel === 'undefined') {
  globalThis.MessageChannel = MessageChannel;
}

const Adapter = AdapterModule.default || AdapterModule;
Enzyme.configure({ adapter: new Adapter() });
configureEnzymeReact19();

const warn = console.warn.bind(console);
console.warn = function (message) {
  if (message?.match('UNSAFE_')) {
    return;
  }
  warn(message);
};

process.env.__testingEnvironment = true;

if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  window.matchMedia = jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }));
}

if (typeof Element !== 'undefined' && typeof Element.prototype.scrollIntoView !== 'function') {
  Element.prototype.scrollIntoView = jest.fn();
}

process.on('unhandledRejection', err => {
  fail(err);
});

if (typeof global.jasmine === 'undefined') {
  const createJasmineSpy = _name => {
    const spy = jest.fn();
    spy.and = {
      callFake: fn => {
        spy.mockImplementation(fn);
        return spy;
      },
      returnValue: value => {
        spy.mockReturnValue(value);
        return spy;
      },
      returnValues: (...values) => {
        spy.mockReturnValueOnce(...values);
        return spy;
      },
      throwError: error => {
        spy.mockImplementation(() => {
          throw error;
        });
        return spy;
      },
    };
    Object.defineProperty(spy, 'calls', {
      get: () => {
        if (!spy.mock || !Array.isArray(spy.mock.calls)) {
          return {
            all: () => [],
            count: () => 0,
            argsFor: () => [],
            allArgs: () => [],
            mostRecent: () => ({ args: [] }),
            first: () => ({ args: [] }),
            reset: () => {},
          };
        }
        const callsFn = () => spy.mock.calls;
        callsFn.all = () => spy.mock.calls.map(call => ({ args: call }));
        callsFn.count = () => spy.mock.calls.length;
        callsFn.argsFor = index => spy.mock.calls[index];
        callsFn.allArgs = () => spy.mock.calls.map(call => call[0]);
        callsFn.mostRecent = () => ({
          args: spy.mock.calls[spy.mock.calls.length - 1] || [],
        });
        callsFn.first = () => ({
          args: spy.mock.calls[0] || [],
        });
        callsFn.reset = () => spy.mockClear();
        return callsFn;
      },
      configurable: true,
    });
    return spy;
  };

  global.jasmine = {
    createSpyObj: (name, methodNames) => {
      let names = methodNames;
      if (Array.isArray(name)) {
        names = name;
      }

      const obj = {};

      for (let i = 0; i < names.length; i += 1) {
        obj[names[i]] = createJasmineSpy(names[i]);
      }

      return obj;
    },
    createSpy: createJasmineSpy,
    clock: () => ({
      install: jest.useFakeTimers,
      uninstall: jest.clearAllTimers,
      tick: jest.advanceTimersByTime,
    }),
    any: expect.any,
    objectContaining: expect.objectContaining,
    arrayContaining: expect.arrayContaining,
    stringMatching: expect.stringMatching,
  };

  global.spyOn = (obj, methodName) => {
    const spy = jest.spyOn(obj, methodName);
    if (!spy || !spy.mock) {
      return spy;
    }
    spy.and = {
      callFake: fn => {
        spy.mockImplementation(fn);
        return spy;
      },
      returnValue: value => {
        spy.mockReturnValue(value);
        return spy;
      },
      returnValues: (...values) => {
        spy.mockReturnValueOnce(...values);
        return spy;
      },
      throwError: error => {
        spy.mockImplementation(() => {
          throw error;
        });
        return spy;
      },
    };
    Object.defineProperty(spy, 'calls', {
      get: () => {
        if (!spy.mock || !Array.isArray(spy.mock.calls)) {
          return {
            all: () => [],
            count: () => 0,
            argsFor: () => [],
            allArgs: () => [],
            mostRecent: () => ({ args: [] }),
            first: () => ({ args: [] }),
            reset: () => {},
          };
        }
        const callsFn = () => spy.mock.calls;
        callsFn.all = () => spy.mock.calls.map(call => ({ args: call }));
        callsFn.count = () => spy.mock.calls.length;
        callsFn.argsFor = index => spy.mock.calls[index];
        callsFn.allArgs = () => spy.mock.calls.map(call => call[0]);
        callsFn.mostRecent = () => ({
          args: spy.mock.calls[spy.mock.calls.length - 1] || [],
        });
        callsFn.first = () => ({
          args: spy.mock.calls[0] || [],
        });
        callsFn.reset = () => spy.mockClear();
        return callsFn;
      },
      configurable: true,
    });
    return spy;
  };
}
