/* eslint-disable import/no-extraneous-dependencies */
import '@testing-library/jest-dom';
import Adapter from '@cfaester/enzyme-adapter-react-18';

import { configure } from 'enzyme';

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

jasmine.createSpyObj = (name, methodNames) => {
  let names = methodNames;
  if (Array.isArray(name)) {
    names = name;
  }

  const obj = {};

  for (let i = 0; i < names.length; i += 1) {
    obj[names[i]] = jasmine.createSpy(names[i]);
  }

  return obj;
};

const clock = {
  install: jest.useFakeTimers,
  uninstall: jest.clearAllTimers,
  tick: jest.advanceTimersByTime,
};
jasmine.clock = () => clock;
