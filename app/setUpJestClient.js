/* eslint-disable import/no-extraneous-dependencies */
import '@testing-library/jest-dom';

const { configure } = require('enzyme');
const Adapter = require('enzyme-adapter-react-16');

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
