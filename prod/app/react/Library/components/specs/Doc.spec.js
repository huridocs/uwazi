"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");
var _immutable = require("immutable");

var _Layout = require("../../../Layout");
var _Auth = require("../../../Auth");
var _Doc = require("../Doc");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function ownKeys(object, enumerableOnly) {var keys = Object.keys(object);if (Object.getOwnPropertySymbols) {keys.push.apply(keys, Object.getOwnPropertySymbols(object));}if (enumerableOnly) keys = keys.filter(function (sym) {return Object.getOwnPropertyDescriptor(object, sym).enumerable;});return keys;}function _objectSpread(target) {for (var i = 1; i < arguments.length; i++) {if (i % 2) {var source = arguments[i] != null ? arguments[i] : {};ownKeys(source, true).forEach(function (key) {_defineProperty(target, key, source[key]);});} else if (Object.getOwnPropertyDescriptors) {Object.defineProperties(target, Object.getOwnPropertyDescriptors(arguments[i]));} else {ownKeys(source).forEach(function (key) {Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(arguments[i], key));});}}return target;}function _defineProperty(obj, key, value) {if (key in obj) {Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });} else {obj[key] = value;}return obj;}



describe('Doc', () => {
  let component;
  let props = {};

  beforeEach(() => {
    const doc = {
      _id: 'idOne',
      template: 'templateId',
      creationDate: 1234,
      type: 'document',
      sharedId: 'id',
      processed: true,
      connections: [{ sourceType: 'metadata' }, { _id: 'c1', sourceType: 'other', nonRelevant: true }] };


    props = {
      doc: (0, _immutable.fromJS)(doc),
      user: (0, _immutable.fromJS)({ _id: 'batId' }),
      active: false,
      selectDocument: jasmine.createSpy('selectDocument'),
      deleteConnection: jasmine.createSpy('deleteConnection'),
      unselectDocument: jasmine.createSpy('unselectDocument'),
      unselectAllDocuments: jasmine.createSpy('unselectAllDocuments'),
      searchParams: { sort: 'sortProperty' },
      storeKey: 'library',
      additionalText: 'passedAdditionalText' };

  });

  const render = () => {
    component = (0, _enzyme.shallow)(_react.default.createElement(_Doc.Doc, props));
  };

  describe('Item data', () => {
    it('should hold the entire Doc as Immutable', () => {
      render();
      expect(component.find(_Layout.Item).props().doc).toEqual((0, _immutable.fromJS)(props.doc));
    });

    describe('Connections header', () => {
      let header;

      beforeEach(() => {
        render();
        header = (0, _enzyme.shallow)(component.find(_Layout.Item).props().itemHeader);
      });

      it('should pass the connections and include delete button for only non-metadata properties', () => {
        expect(header.find('.item-connection').length).toBe(2);
        expect(header.find('button').at(0).parents().at(1).is(_Auth.NeedAuthorization)).toBe(true);
        expect(header.find('button').at(0).parent().props().if).toBe(false);
        expect(header.find('button').at(1).parent().props().if).toBe(true);
      });

      it('should alow deleting non-metadata connections', () => {
        const eMock = { stopPropagation: jasmine.createSpy('stopPropagation') };
        expect(props.deleteConnection).not.toHaveBeenCalled();

        header.find('button').at(1).simulate('click', eMock);

        expect(eMock.stopPropagation).toHaveBeenCalled();
        expect(props.deleteConnection).toHaveBeenCalledWith({ _id: 'c1', sourceType: 'other' });
      });
    });

    it('should pass the className to the item', () => {
      render();
      expect(component.find(_Layout.Item).props().className).toBeUndefined();
      props.className = 'passed-classname';
      render();
      expect(component.find(_Layout.Item).props().className).toContain('passed-classname');
    });

    it('should pass the searchParams to the item', () => {
      render();
      expect(component.find(_Layout.Item).props().searchParams.sort).toBe('sortProperty');
    });

    it('should pass the additionalText to the item', () => {
      render();
      expect(component.find(_Layout.Item).props().additionalText).toBe('passedAdditionalText');
    });
  });

  describe('when doc is not active', () => {
    it('should not be active', () => {
      render();
      expect(component.find(_Layout.Item).props().active).toBe(false);
    });
  });

  describe('when doc is active', () => {
    it('should be active true', () => {
      props.active = true;
      render();
      expect(component.find(_Layout.Item).props().active).toBe(true);
    });
  });

  describe('when target reference is specified', () => {
    it('should pass the target reference to the ViewDocButton', () => {
      props.targetReference = (0, _immutable.fromJS)({ range: { start: 100, end: 200 } });
      render();
      expect(component).toMatchSnapshot();
    });
    it('should update component if target reference changes', () => {
      props.targetReference = null;
      render();
      const nextProps = _objectSpread({}, props, { targetReference: (0, _immutable.fromJS)({ range: {} }) });
      expect(component.instance().shouldComponentUpdate(nextProps)).toBe(true);
    });
  });

  describe('onClick', () => {
    it('should call onClick', () => {
      props.onClick = jasmine.createSpy('onClick');
      render();
      component.find(_Layout.Item).simulate('click', { metaKey: false });
      expect(props.onClick).toHaveBeenCalled();
    });
  });

  describe('maped state', () => {
    let store;

    beforeEach(() => {
      store = {
        library: {
          ui: (0, _immutable.fromJS)({ selectedDocuments: [{ _id: 'docId' }] }) },

        uploads: {
          progress: (0, _immutable.fromJS)({}) },

        user: (0, _immutable.fromJS)({ _id: 'batId' }) };

    });

    it('should set active as true if ownProps match selected ID', () => {
      const state = (0, _Doc.mapStateToProps)(store, { doc: (0, _immutable.fromJS)({ _id: 'docId' }), storeKey: 'library' });
      expect(state.active).toBe(true);
    });

    it('should set active as false if ownProps holds unselected document', () => {
      const state = (0, _Doc.mapStateToProps)(store, { doc: (0, _immutable.fromJS)({ _id: 'anotherId' }), storeKey: 'library' });
      expect(state.active).toBe(false);
    });
  });
});