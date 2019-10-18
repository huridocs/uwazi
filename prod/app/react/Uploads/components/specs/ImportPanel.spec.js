"use strict";var _react = _interopRequireDefault(require("react"));
var _immutable = _interopRequireDefault(require("immutable"));

var _ImportPanel = require("../ImportPanel");
var _enzyme = require("enzyme");
var _reactReduxForm = require("react-redux-form");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('ImportPanel', () => {
  let component;

  const props = {
    open: true,
    templates: _immutable.default.fromJS([{ name: 'superheroes', default: true, _id: 234 }]),
    uploadProgress: 0,
    importStart: false,
    importProgress: 0,
    closeImportPanel: jasmine.createSpy('closeImportPanel'),
    importData: jasmine.createSpy('importData') };



  const render = () => {
    component = (0, _enzyme.shallow)(_react.default.createElement(_ImportPanel.ImportPanel, props));
  };

  describe('submiting the form', () => {
    it('should call importData', () => {
      render();
      const values = {
        template: 234,
        file: { name: 'im a file!' } };

      component.find(_reactReduxForm.LocalForm).simulate('submit', values);
      expect(props.importData).toHaveBeenCalledWith(values.file, values.template);
    });
  });

  describe('rendering states', () => {
    it('should render a form', () => {
      render();
      expect(component).toMatchSnapshot();
    });

    describe('when the upload starts', () => {
      it('should render an upload progress', () => {
        props.uploadProgress = 23;
        render();
        expect(component).toMatchSnapshot();
      });
    });

    describe('when the import starts', () => {
      it('should render an upload progress', () => {
        props.importStart = true;
        props.importProgress = 189;
        render();
        expect(component).toMatchSnapshot();
      });
    });
  });
});