"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");
var _immutable = require("immutable");
var _DocumentLanguage = require("../DocumentLanguage");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('DocumentLanguage', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      doc: (0, _immutable.fromJS)({
        type: 'entity',
        icon: { _id: 'icon', type: 'Icons' },
        title: 'doc title',
        template: 'templateId',
        creationDate: 123,
        snippets: [] }) };


  });

  const render = () => {
    component = (0, _enzyme.shallow)(_react.default.createElement(_DocumentLanguage.DocumentLanguage, props));
  };

  it('should not show a language if doc is not a document-type entity is not present', () => {
    render();
    expect(component.getElements()[0]).toBe(null);
  });

  describe('When file matches current locale', () => {
    it('should not show a language', () => {
      props.locale = 'es';
      props.doc = props.doc.set('file', (0, _immutable.fromJS)({ language: 'spa' }));

      render();

      expect(component.getElements()[0]).toBe(null);
    });
  });

  describe('When file does not match current locale', () => {
    it('should include language tag ISO639-1 if file language is a supported language', () => {
      props.locale = 'es';
      props.doc = props.doc.set('file', (0, _immutable.fromJS)({ language: 'eng' }));

      render();

      expect(component.find('.item-type__documentLanguage').length).toBe(1);
      expect(component.find('.item-type__documentLanguage').text()).toBe('en');

      props.locale = 'es';
      props.doc = props.doc.set('file', (0, _immutable.fromJS)({ language: 'por' }));

      render();

      expect(component.find('.item-type__documentLanguage').length).toBe(1);
      expect(component.find('.item-type__documentLanguage').text()).toBe('pt');
    });

    it('should include language tag in FRANC detection if file language is not supported language', () => {
      props.locale = 'es';
      props.doc = props.doc.set('file', (0, _immutable.fromJS)({ language: 'not' }));

      render();

      expect(component.find('.item-type__documentLanguage').length).toBe(1);
      expect(component.find('.item-type__documentLanguage').text()).toBe('not');
    });

    it('should render OTHER if file language is undetected', () => {
      props.locale = 'es';
      props.doc = props.doc.set('file', (0, _immutable.fromJS)({ language: 'other' }));

      render();

      expect(component.find('.item-type__documentLanguage').length).toBe(1);
      expect(component.find('.item-type__documentLanguage').text()).toBe('Other');
    });
  });

  describe('mapStateToProps', () => {
    let locale;

    beforeEach(() => {
      locale = 'lc';
    });

    it('should include locale', () => {
      expect((0, _DocumentLanguage.mapStateToProps)({ locale })).toEqual({ locale });
    });
  });
});