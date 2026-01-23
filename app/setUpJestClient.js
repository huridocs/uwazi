/* eslint-disable import/no-extraneous-dependencies */
import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';
import Adapter from '@cfaester/enzyme-adapter-react-18';

Object.assign(global, { TextDecoder, TextEncoder });

const { configure } = require('enzyme');

configure({ adapter: new Adapter() });

const warn = console.warn.bind(console);
console.warn = function (message) {
  if (message?.match('UNSAFE_')) {
    return;
  }
  warn(message);
};

process.env.__testingEnvironment = true;

process.on('unhandledRejection', err => {
  fail(err);
});

if (typeof global.jasmine === 'undefined') {
  global.jasmine = {
    createSpyObj: (name, methodNames) => {
      let names = methodNames;
      if (Array.isArray(name)) {
        names = name;
      }

      const obj = {};

      for (let i = 0; i < names.length; i += 1) {
        obj[names[i]] = jest.fn();
      }

      return obj;
    },
    createSpy: jest.fn,
    clock: () => ({
      install: jest.useFakeTimers,
      uninstall: jest.clearAllTimers,
      tick: jest.advanceTimersByTime,
    }),
  };
}
