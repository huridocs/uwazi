"use strict";var _immutable = _interopRequireDefault(require("immutable"));
var _react = _interopRequireDefault(require("react"));

var _enzyme = require("enzyme");
var _api = _interopRequireDefault(require("../../../utils/api"));
var _Layout = require("../../../Layout");

var _CustomUploads = require("../CustomUploads");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('CustomUploads', () => {
  let component;
  let props;
  let context;

  beforeEach(() => {
    spyOn(_api.default, 'get').and.returnValue(Promise.resolve({ json: 'uploads' }));
    props = {
      upload: jasmine.createSpy('upload'),
      deleteCustomUpload: jasmine.createSpy('deleteCustomUpload'),
      customUploads: _immutable.default.fromJS([]) };

  });

  const render = () => {
    context = { store: { getState: () => ({}), dispatch: jasmine.createSpy('dispatch') } };
    component = (0, _enzyme.shallow)(_react.default.createElement(_CustomUploads.CustomUploads, props), { context });
  };

  it('should render CustomUploads component with uploaded files', () => {
    props.customUploads = _immutable.default.fromJS([
    { filename: 'file1' },
    { filename: 'file2' }]);

    render();
    expect(component).toMatchSnapshot();
  });

  describe('when upload on progress', () => {
    it('should render on progress feedback', () => {
      props.progress = true;
      render();
      expect(component).toMatchSnapshot();
    });
  });

  describe('deleteCustomUpload', () => {
    it('should call deleteCustomUpload on click', () => {
      props.customUploads = _immutable.default.fromJS([{ _id: 'upload', filename: 'name' }]);
      render();

      component.find(_Layout.ConfirmButton).props().action();

      expect(props.deleteCustomUpload).toHaveBeenCalledWith('upload');
    });
  });

  describe('mapStateToProps', () => {
    it('should map current progress and files to props', () => {
      const state = {
        customUploads: 'customUploads',
        progress: _immutable.default.fromJS({}) };


      props = (0, _CustomUploads.mapStateToProps)(state);
      expect(props.customUploads).toBe('customUploads');
      expect(props.progress).toBe(false);

      state.progress = _immutable.default.fromJS({ customUpload_unique_id: 1, customUpload_unique_id2: 100 });
      props = (0, _CustomUploads.mapStateToProps)(state);
      expect(props.progress).toBe(true);

      state.progress = _immutable.default.fromJS({ not_custom_upload: 9 });
      props = (0, _CustomUploads.mapStateToProps)(state);
      expect(props.progress).toBe(false);
    });
  });

  describe('requestState', () => {
    it('should get the uploads', async () => {
      const request = {};
      const actions = await _CustomUploads.CustomUploads.requestState(request);

      expect(_api.default.get).toHaveBeenCalledWith('customisation/upload', request);
      expect(actions).toMatchSnapshot();
    });
  });
});