"use strict";var _react = _interopRequireDefault(require("react"));

var _enzyme = require("enzyme");
var _api = _interopRequireDefault(require("../../../utils/api"));
var _ContactForm = require("../ContactForm.js");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('ContactForm', () => {
  let props;

  beforeEach(() => {
    spyOn(_api.default, 'post').and.returnValue(Promise.resolve());
    props = { notify: () => {} };
  });

  it('should render the ContactForm', () => {
    const component = (0, _enzyme.shallow)(_react.default.createElement(_ContactForm.ContactForm, props));
    expect(component).toMatchSnapshot();
  });

  it('should submit the values', done => {
    const formData = { name: 'Peter Parker', email: 'peter@parker.com', message: 'I miss uncle Ben' };
    props.notify = () => {
      expect(_api.default.post).toHaveBeenCalledWith('contact', formData);
      done();
    };
    const component = (0, _enzyme.shallow)(_react.default.createElement(_ContactForm.ContactForm, props));
    component.instance().setState(formData);
    const form = component.find('form');
    form.simulate('submit', { preventDefault: () => {} });
  });
});