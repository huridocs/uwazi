"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");
var _immutable = require("immutable");

var _AttachmentsList = require("../AttachmentsList");
var _Attachment = _interopRequireDefault(require("../Attachment"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('AttachmentsList', () => {
  let component;
  let props;
  let files;

  beforeEach(() => {
    files = (0, _immutable.fromJS)([
    { originalname: 'Human name 1', filename: 'filename1.ext' },
    { originalname: 'A Human name 2', filename: 'filename2.ext' }]);


    props = {
      files,
      parentId: 'parentId',
      parentSharedId: 'parentSharedId',
      isDocumentAttachments: false,
      readOnly: false,
      storeKey: 'storeKey',
      user: (0, _immutable.fromJS)({}) };

  });

  const render = () => {
    component = (0, _enzyme.shallow)(_react.default.createElement(_AttachmentsList.AttachmentsList, props));
  };

  it('should render a sorted list of attachments (files)', () => {
    render();
    expect(component).toMatchSnapshot();
  });

  describe('When parent is Target Document', () => {
    beforeEach(() => {
      props.isTargetDoc = true;
      render();
    });

    it('should treat all Attachments as read only', () => {
      expect(component).toMatchSnapshot();
    });
  });

  describe('when files is empty', () => {
    it('should render nothing if user not logged in', () => {
      props.files = (0, _immutable.fromJS)([]);
      render();
      expect(component).toMatchSnapshot();
    });

    it('should add button in Downloads section', () => {
      props.files = (0, _immutable.fromJS)([]);
      props.user = (0, _immutable.fromJS)({ _id: 'user' });
      render();
      expect(component).toMatchSnapshot();
    });
  });

  describe('When isDocumentAttachments', () => {
    beforeEach(() => {
      props.isDocumentAttachments = true;
      render();
    });

    it('should pass isSourceDocument true to the first attachment and the entity id', () => {
      expect(component.find(_Attachment.default).at(0).props().isSourceDocument).toBe(true);
      expect(component.find(_Attachment.default).at(0).props().file._id).toBe('parentId');
      expect(component.find(_Attachment.default).at(1).props().isSourceDocument).toBe(false);
    });
  });
});