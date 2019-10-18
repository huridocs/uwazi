"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");
var _immutable = require("immutable");

var _UploadAttachment = require("../UploadAttachment");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('UploadAttachment', () => {
  let component;
  let props;
  let e;

  beforeEach(() => {
    e = { target: { files: [{ id: 'f1' }] } };
    props = {
      uploadAttachment: jasmine.createSpy('uploadAttachment'),
      entity: 'idE1',
      progress: (0, _immutable.fromJS)({}),
      languages: (0, _immutable.fromJS)(['en']),
      storeKey: 'library' };

  });

  const render = () => {
    component = (0, _enzyme.shallow)(_react.default.createElement(_UploadAttachment.UploadAttachment, props));
  };

  it('should include label and input to upload attachment', () => {
    render();
    expect(component.find('input').length).toBe(1);
    expect(component.find('label').props().htmlFor).toBe('upload-attachment-input');
    expect(component.find('label > input').props().id).toBe('upload-attachment-input');

    expect(props.uploadAttachment).not.toHaveBeenCalled();
    component.find('label > input').props().onChange(e);
    expect(props.uploadAttachment).toHaveBeenCalledWith(props.entity, { id: 'f1' }, 'library');
  });

  describe('when there are multiple languages', () => {
    it('should have another input to upload to all languages', () => {
      props.languages = (0, _immutable.fromJS)(['es', 'en']);
      render();

      expect(component.find('input').length).toBe(2);

      expect(component.find('label').at(0).props().htmlFor).toBe('upload-attachment-input');
      expect(component.find('label > input').at(0).props().id).toBe('upload-attachment-input');
      expect(component.find('label').at(1).props().htmlFor).toBe('upload-attachment-all-input');
      expect(component.find('label > input').at(1).props().id).toBe('upload-attachment-all-input');

      expect(props.uploadAttachment).not.toHaveBeenCalled();
      component.find('label > input').at(0).props().onChange(e);
      expect(props.uploadAttachment).toHaveBeenCalledWith(props.entity, { id: 'f1' }, 'library');

      props.uploadAttachment.calls.reset();

      expect(props.uploadAttachment).not.toHaveBeenCalled();
      component.find('label > input').at(1).props().onChange(e);
      expect(props.uploadAttachment).toHaveBeenCalledWith(props.entity, { id: 'f1' }, 'library', { allLanguages: true });
    });
  });

  describe('when uploading', () => {
    it('should show a progress bar only', () => {
      props.languages = (0, _immutable.fromJS)(['es', 'en']);
      props.progress = (0, _immutable.fromJS)({ idE1: 77 });

      render();

      expect(component.find('input').length).toBe(0);

      expect(component.find('span').at(1).text()).toMatch('77%');
    });
  });
});