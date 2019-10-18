"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");
var _immutable = _interopRequireWildcard(require("immutable"));

var _DocumentsList = require("../DocumentsList");
var _DocumentsList2 = _interopRequireDefault(require("../../../Layout/DocumentsList"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('Library DocumentsList container', () => {
  let component;
  let instance;
  let props;
  const documents = _immutable.default.fromJS({ rows: [
    { title: 'Document one', _id: '1' },
    { title: 'Document two', _id: '2' },
    { title: 'Document three', _id: '3' }],

    totalRows: 3 });

  beforeEach(() => {
    props = {
      documents,
      selectedDocuments: _immutable.default.fromJS([]),
      search: { sort: 'sort' },
      filters: _immutable.default.fromJS({ documentTypes: [] }),
      searchDocuments: () => {},
      user: _immutable.default.fromJS({}),
      unselectAllDocuments: jasmine.createSpy('unselectAllDocuments'),
      selectDocument: jasmine.createSpy('selectDocument'),
      selectDocuments: jasmine.createSpy('selectDocuments'),
      unselectDocument: jasmine.createSpy('unselectDocument'),
      authorized: true,
      storeKey: 'library' };

  });

  const render = () => {
    component = (0, _enzyme.shallow)(_react.default.createElement(_DocumentsList2.default, props));
    instance = component.instance();
  };

  describe('clickOnDocument()', () => {
    it('should select the document', () => {
      render();
      const e = {};
      const doc = _immutable.default.fromJS({ _id: '1' });
      const active = false;
      _DocumentsList.clickOnDocument.call(instance, e, doc, active);
      expect(props.unselectAllDocuments).toHaveBeenCalled();
      expect(props.selectDocument).toHaveBeenCalledWith(doc);
    });

    describe('when holding cmd or ctrl', () => {
      it('should add the document to the selected documents', () => {
        render();
        const e = { metaKey: true };
        const doc = _immutable.default.fromJS({ _id: '1' });
        const active = false;
        _DocumentsList.clickOnDocument.call(instance, e, doc, active);
        expect(props.unselectAllDocuments).not.toHaveBeenCalled();
        expect(props.selectDocument).toHaveBeenCalledWith(doc);
      });
    });

    describe('when holding shift', () => {
      it('should select all the documents from the last selected document to the one clicked', () => {
        props.selectedDocuments = _immutable.default.fromJS([{ _id: '1' }]);
        render();
        const e = { shiftKey: true };
        const doc = _immutable.default.fromJS({ _id: '3' });
        const active = false;
        _DocumentsList.clickOnDocument.call(instance, e, doc, active);
        expect(props.unselectAllDocuments).not.toHaveBeenCalled();
        expect(props.selectDocuments).toHaveBeenCalledWith(documents.toJS().rows);
      });
    });
  });

  describe('maped state', () => {
    it('should contain the documents, library filters and search options', () => {
      const filters = (0, _immutable.fromJS)({ documentTypes: [] });

      const store = {
        library: {
          documents,
          filters,
          ui: (0, _immutable.fromJS)({ filtersPanel: 'panel', selectedDocuments: ['selected'], zoomLevel: 2 }),
          search: { sort: 'sortProperty' } },

        user: (0, _immutable.fromJS)({ _id: 'uid' }) };


      const state = (0, _DocumentsList.mapStateToProps)(store, { storeKey: 'library' });
      expect(state).toEqual({
        documents,
        filters,
        filtersPanel: 'panel',
        search: { sort: 'sortProperty' },
        selectedDocuments: store.library.ui.get('selectedDocuments'),
        multipleSelected: false,
        authorized: true,
        rowListZoomLevel: 2,
        clickOnDocument: _DocumentsList.clickOnDocument });

    });
  });
});