const {configure} = require('enzyme');
const Adapter = require('enzyme-adapter-react-16');
import * as matchers from 'jest-immutable-matchers';
jest.addMatchers(matchers);

// Setup enzyme's react adapter
configure({adapter: new Adapter()});

const error = console.error.bind(console);
console.error = function(message){
  if (message.match('/api/i18n/systemKeys')) {
    return;
  }
  error(message);
};

jasmine.createSpyObj = (name, methodNames) => {
  let names = methodNames;
  if (Array.isArray(name)) {
    names = name;
  }

  let obj = {};

  for (let i = 0; i < names.length; i += 1) {
    obj[names[i]] = jasmine.createSpy(names[i]);
  }

  return obj;
};

const clock = {
  install: jest.useFakeTimers,
  uninstall: jest.clearAllTimers,
  tick: jest.advanceTimersByTime
};
jasmine.clock = () => clock;
