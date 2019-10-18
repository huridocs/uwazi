"use strict";var _react = _interopRequireDefault(require("react"));

var _enzyme = require("enzyme");

var _Thumbnail = require("../Thumbnail");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('Thumbnail', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {};
  });

  const render = () => {
    component = (0, _enzyme.shallow)(_react.default.createElement(_Thumbnail.Thumbnail, props));
  };

  it('should render an image when file has image extension', () => {
    props.file = 'image.jpg';
    render();
    expect(component).toMatchSnapshot();
  });

  it('should render pdf icon when .pdf extension', () => {
    props.file = 'pdf.pdf';
    render();
    expect(component).toMatchSnapshot();
  });

  it('should render generic file as default', () => {
    props.file = 'document.doc';
    render();
    expect(component).toMatchSnapshot();
  });
});