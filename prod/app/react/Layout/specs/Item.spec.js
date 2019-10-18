"use strict";var _immutable = require("immutable");
var _react = _interopRequireDefault(require("react"));

var _prioritySortingCriteria = _interopRequireDefault(require("../../utils/prioritySortingCriteria"));
var _enzyme = require("enzyme");

var _Metadata = require("../../Metadata");
var _Item = require("../Item");
var _Lists = require("../Lists");
var _DocumentLanguage = _interopRequireDefault(require("../DocumentLanguage"));
var Icon = _interopRequireWildcard(require("../Icon"));
var _TemplateLabel = _interopRequireDefault(require("../TemplateLabel"));
var _ItemSnippet = _interopRequireDefault(require("../ItemSnippet"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

describe('Item', () => {
  let component;
  let props;

  beforeEach(() => {
    Icon.default = Icon.Icon;
    props = {
      doc: (0, _immutable.fromJS)({
        type: 'entity',
        icon: { _id: 'icon', type: 'Icons' },
        title: 'doc title',
        template: 'templateId',
        creationDate: 123,
        snippets: [] }),

      active: true,
      className: 'custom-class',
      onClick: jasmine.createSpy('onClick'),
      onSnippetClick: jasmine.createSpy('onSnippetClick'),
      onMouseEnter: jasmine.createSpy('onMouseEnter'),
      onMouseLeave: jasmine.createSpy('onMouseLeave'),
      additionalIcon: _jsx("div", {}, void 0, "additionalIcon"),
      buttons: _jsx("div", {}, void 0, "Buttons"),
      templates: (0, _immutable.fromJS)([]),
      thesauris: (0, _immutable.fromJS)([]) };

  });

  const render = () => {
    component = (0, _enzyme.shallow)(_react.default.createElement(_Item.Item, props));
  };

  it('should have default props values assigned', () => {
    render();
    expect(component.instance().props.search).toEqual(_prioritySortingCriteria.default.get());
  });

  it('should extend RowList.Item and append active, type and classNames correctly', () => {
    render();
    expect(component.find(_Lists.RowList.Item).props().className).toContain('item-document');
    expect(component.find(_Lists.RowList.Item).props().className).toContain('custom-class');
    expect(component.find(_Lists.RowList.Item).props().active).toBe(true);
  });

  it('should replicate onClick, onMouseEnter and onMouseLeave behaviours of parent', () => {
    render();
    component.find(_Lists.RowList.Item).simulate('click');
    expect(props.onClick).toHaveBeenCalled();

    component.find(_Lists.RowList.Item).simulate('mouseEnter');
    expect(props.onMouseEnter).toHaveBeenCalled();

    component.find(_Lists.RowList.Item).simulate('mouseLeave');
    expect(props.onMouseLeave).toHaveBeenCalled();
  });

  it('should include a header if present', () => {
    props.itemHeader = _jsx("div", { className: "item-header" }, void 0, "Item Header");
    render();

    expect(component.find('.item-header').text()).toBe('Item Header');
  });

  it('should include additionalIcon, icon and title in the components name', () => {
    render();
    expect(component.find('.item-name').text()).toContain('additionalIcon');
    expect(component.find('.item-name').text()).toContain('doc title');
    expect(component.find('.item-name').find(Icon.default).props().data).toEqual({ _id: 'icon', type: 'Icons' });
    expect(component.find('.item-name').find(_DocumentLanguage.default).props().doc).toBe(props.doc);
  });

  it('should accept a different property name for the title', () => {
    props.doc = props.doc.set('label', 'label as title');
    props.titleProperty = 'label';
    render();
    expect(component.find('.item-name').text()).toContain('label as title');
  });

  it('should include a template label and custom buttons inside the footer', () => {
    render();
    expect(component.find(_Lists.ItemFooter).find(_TemplateLabel.default).props().template).toBe('templateId');
    expect(component.find(_Lists.ItemFooter).find('div').at(0).text()).toContain('Buttons');
  });

  describe('Metadata', () => {
    it('should render FormatMetadata passing entity sort property and additionalMetadata', () => {
      props.search = { sort: 'sortedProperty' };
      props.additionalMetadata = ['additioal', 'metadata'];
      render();
      expect(component.find(_Metadata.FormatMetadata).props().entity).toEqual(props.doc.toJS());
      expect(component.find(_Metadata.FormatMetadata).props().sortedProperty).toBe(props.search.sort);
      expect(component.find(_Metadata.FormatMetadata).props().additionalMetadata).toBe(props.additionalMetadata);
    });
  });

  describe('when doc have no snippets', () => {
    it('should not render snippet secction when undefined', () => {
      props.doc = (0, _immutable.fromJS)({
        type: 'entity',
        icon: { _id: 'icon', type: 'Icons' },
        title: 'doc title',
        template: 'templateId',
        creationDate: 123 });


      render();
      expect(component.find('.item-snippet').length).toBe(0);
    });
    it('should not render snippet secction when empty', () => {
      props.doc = (0, _immutable.fromJS)({
        type: 'entity',
        icon: { _id: 'icon', type: 'Icons' },
        title: 'doc title',
        template: 'templateId',
        creationDate: 123,
        snippets: [] });


      render();
      expect(component.find('.item-snippet').length).toBe(0);
    });
  });

  describe('when doc have snippets', () => {
    it('should render ItemSnippet including doc, snippets and onSnippetClick props', () => {
      props.doc = (0, _immutable.fromJS)({
        type: 'entity',
        icon: { _id: 'icon', type: 'Icons' },
        title: 'doc title',
        template: 'templateId',
        creationDate: 123,
        snippets: {
          count: 1,
          metadata: [],
          fullText: [{ text: '<span>snippet!</span>', page: 1 }] } });



      render();
      expect(component.find(_ItemSnippet.default)).toMatchSnapshot();
    });
  });

  describe('mapStateToProps', () => {
    let templates;
    let thesauris;
    let search;

    beforeEach(() => {
      templates = 'templates';
      thesauris = 'thesauris';
    });

    it('should include templates, thesauris and default sort', () => {
      expect((0, _Item.mapStateToProps)({ templates, thesauris }, {})).toEqual({ templates, thesauris, search });
    });

    it('should allow overriding the default sort', () => {
      const ownProps = { searchParams: { sort: 'newSort' } };
      expect((0, _Item.mapStateToProps)({ templates, thesauris }, ownProps)).toEqual({ templates, thesauris, search: { sort: 'newSort' } });
    });
  });
});