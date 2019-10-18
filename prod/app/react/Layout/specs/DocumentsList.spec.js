"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");
var _immutable = _interopRequireDefault(require("immutable"));

var _Doc = _interopRequireDefault(require("../../Library/components/Doc"));
var _SortButtons = _interopRequireDefault(require("../../Library/components/SortButtons"));
var _Footer = _interopRequireDefault(require("../../App/Footer"));

var _DocumentsList = require("../DocumentsList");
var _Lists = require("../Lists");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

describe('DocumentsList', () => {
  let component;
  let instance;
  let props;
  const documents = _immutable.default.fromJS({ rows: [{ title: 'Document one', _id: '1' }, { title: 'Document two', _id: '2' }], totalRows: 2 });

  beforeEach(() => {
    props = {
      documents,
      search: { sort: 'sort' },
      filters: _immutable.default.fromJS({ documentTypes: [] }),
      clickOnDocument: { apply: jasmine.createSpy('clickOnDocumentApply') },
      onSnippetClick: jasmine.createSpy('onSnippetClick'),
      loadMoreDocuments: jasmine.createSpy('loadMoreDocuments'),
      storeKey: 'library',
      searchDocuments: () => {},
      deleteConnection: () => {},
      location: { query: { q: '', pathname: 'library/' } } };

  });

  const render = () => {
    component = (0, _enzyme.shallow)(_react.default.createElement(_DocumentsList.DocumentsList, props));
    instance = component.instance();
  };

  describe('List view', () => {
    beforeEach(() => {
      render();
    });

    it('should pass to RowList the zoom level passed to component', () => {
      expect(component.find(_Lists.RowList).props().zoomLevel).toBe(0);
      props.rowListZoomLevel = 3;
      render();
      expect(component.find(_Lists.RowList).props().zoomLevel).toBe(3);
    });

    it('should render a Doc element for each document, passing the search options', () => {
      const docs = component.find(_Doc.default);
      expect(docs.length).toBe(2);
      expect(docs.first().props().doc.get('title')).toBe('Document one');
      expect(docs.first().props().searchParams).toEqual({ sort: 'sort' });
      expect(docs.first().props().deleteConnection).toBe(props.deleteConnection);
    });

    it('should pass onClickSnippet to Doc', () => {
      const docProps = component.find(_Doc.default).at(0).props();
      expect(docProps.onSnippetClick).toBe(props.onSnippetClick);
    });

    describe('Clicking on a document', () => {
      it('should call on props.clickOnDocument if present', () => {
        component.find(_Doc.default).at(0).simulate('click', 'e', 'other args');
        expect(props.clickOnDocument.apply.calls.mostRecent().args[0]).toBe(instance);
        expect(props.clickOnDocument.apply.calls.mostRecent().args[1][0]).toBe('e');
        expect(props.clickOnDocument.apply.calls.mostRecent().args[1][1]).toBe('other args');
      });
    });
  });

  describe('Graph view', () => {
    beforeEach(() => {
      props.view = 'graph';
      props.GraphView = () => _jsx("div", {}, void 0, "GraphView");
      render();
    });

    it('should not render Doc elements', () => {
      expect(component.find(_Doc.default).length).toBe(0);
    });

    it('should render GraphView prop', () => {
      expect(component.find(props.GraphView).length).toBe(1);
      expect(component.find(props.GraphView).getElements()[0].type().props.children).toBe('GraphView');
    });
  });

  it('should render action buttons if passed as props', () => {
    render();
    expect(component.find('.search-list-actions').length).toBe(0);

    const ActionButtons = () => _jsx("div", {}, void 0, "action buttons");
    props.ActionButtons = ActionButtons;

    render();
    expect(component.find('.search-list-actions').length).toBe(1);
    expect(component.find('.search-list-actions').childAt(0).getElements()[0].type().props.children).toBe('action buttons');
  });

  it('should hold sortButtons with search callback and selectedTemplates', () => {
    render();
    expect(component.find(_SortButtons.default).props().sortCallback).toBe(props.searchDocuments);
    expect(component.find(_SortButtons.default).props().selectedTemplates).toBe(props.filters.get('documentTypes'));
  });

  describe('Load More button', () => {
    it('should render by default a load more button', () => {
      props.documents = props.documents.set('totalRows', 3);
      render();

      expect(component.find('.btn-load-more').length).toBe(2);
      component.find('.btn-load-more').at(0).simulate('click');
      expect(props.loadMoreDocuments).toHaveBeenCalledWith('library', 32);
    });

    it('should render a custom passed load more', () => {
      props.documents = props.documents.set('totalRows', 3);
      props.LoadMoreButton = () => _jsx("div", { className: "customLoadMoreButton" });
      render();

      expect(component.find('.btn-load-more').length).toBe(0);
      expect(component.find(props.LoadMoreButton).length).toBe(1);
    });
  });

  describe('Footer', () => {
    it('should render by default', () => {
      render();
      expect(component.find(_Footer.default).length).toBe(1);
    });

    it('should hide the footer if prop passed', () => {
      props.hideFooter = true;
      render();
      expect(component.find(_Footer.default).length).toBe(0);
    });
  });
});