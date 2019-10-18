"use strict";var _immutable = require("immutable");
var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");

var _Connections = require("../../../Connections");
var _ContextMenu = _interopRequireDefault(require("../../../ContextMenu"));
var _ShowIf = _interopRequireDefault(require("../../../App/ShowIf"));
var _RequestParams = require("../../../utils/RequestParams");
var _Viewer = require("../Viewer");
var _SourceDocument = _interopRequireDefault(require("../SourceDocument"));
var _TargetDocument = _interopRequireDefault(require("../TargetDocument"));
var routeActions = _interopRequireWildcard(require("../../actions/routeActions"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}


describe('Viewer', () => {
  let component;
  let props;
  let context;

  beforeEach(() => {
    props = {
      doc: (0, _immutable.fromJS)({ _id: 'id', sharedId: 'sharedId', file: {}, pdfInfo: 'already parsed' }),
      targetDoc: false,
      addReference: () => {},
      loadTargetDocument: () => {},
      location: { query: {} },
      templates: (0, _immutable.fromJS)([]) };

  });

  const render = ({ mount = false } = {}) => {
    context = { store: { dispatch: jasmine.createSpy('dispatch') } };
    component = (0, _enzyme.shallow)(_react.default.createElement(_Viewer.Viewer, props), { context, disableLifecycleMethods: true });

    if (mount) {
      component.instance().componentDidMount();
      component.update();
    }
  };

  it('should add "connections" className when showConnections', () => {
    props.showConnections = true;
    render();
    expect(component.find('.document-viewer').hasClass('connections')).toBe(true);
  });

  it('should add with-panel className when there is a panel open', () => {
    props.panelIsOpen = true;
    render();
    expect(component.find('.document-viewer').hasClass('with-panel')).toBe(true);
  });

  it('should add show-target-document className when targetDocument loaded', () => {
    props.panelIsOpen = true;
    props.targetDoc = true;
    render();
    expect(component.find('.document-viewer').hasClass('show-target-document')).toBe(true);
  });

  it('should not render SourceDocument when targetDocument loaded', () => {
    props.targetDoc = true;
    render({ mount: true });
    expect(component.find(_SourceDocument.default).parent(_ShowIf.default).props().if).toBe(false);
  });

  it('should render Document after component did mount', () => {
    props.panelIsOpen = true;
    props.showTextSelectMenu = false;

    render({ mount: true });

    expect(component.find(_ContextMenu.default).length).toBe(2);
    expect(component.find(_SourceDocument.default).length).toBe(1);
    expect(component.find(_TargetDocument.default).length).toBe(1);

    expect(component.find(_ContextMenu.default).at(0).props().overrideShow).toBe(true);
    expect(component.find(_ContextMenu.default).at(1).props().overrideShow).toBe(true);

    expect(component.find(_ContextMenu.default).at(0).props().show).toBe(false);
    expect(component.find(_ContextMenu.default).at(1).props().show).toBe(false);
  });

  it('should show the correct panels and menus', () => {
    props.panelIsOpen = false;
    props.showTextSelectMenu = true;

    render();

    expect(component.find(_ContextMenu.default).at(0).props().show).toBe(true);
    expect(component.find(_ContextMenu.default).at(1).props().show).toBe(true);
  });

  it('should render plain text always, if raw is false should render SourceDocument on update', () => {
    render();

    expect(component.find('pre').length).toBe(1);
    component.instance().componentDidMount();
    component.update();
    expect(component.find(_SourceDocument.default).length).toBe(1);

    component.setProps({ raw: true });
    expect(component.find('pre').length).toBe(1);
  });

  it('should add the plain text direction', () => {
    render();
    expect(component.find('pre').props().className).toBe('force-ltr');

    props.doc = props.doc.set('file', (0, _immutable.fromJS)({ language: 'arb' }));
    render();
    expect(component.find('pre').props().className).toBe('force-rtl');

    props.doc = props.doc.set('file', null);
    props.doc = props.doc.set('_id', null);
    render();
    expect(component.find('pre').props().className).toBe('force-ltr');
  });

  describe('createConnectionPanel', () => {
    it('should include the create connections panel with correct props', () => {
      render();
      const createConnectionElement = component.find(_Connections.CreateConnectionPanel).first();
      expect(component.find(_Connections.CreateConnectionPanel).length).toBe(1);
      expect(createConnectionElement.props().containerId).toBe('sharedId');
      expect(createConnectionElement.props().onCreate).toBe(props.addReference);
      expect(createConnectionElement.props().onRangedConnect).toBe(props.loadTargetDocument);
    });

    it('should mark "target" as containerId if targetDocument', () => {
      props.targetDoc = true;
      render();
      const createConnectionElement = component.find(_Connections.CreateConnectionPanel).first();
      expect(component.find(_Connections.CreateConnectionPanel).length).toBe(1);
      expect(createConnectionElement.props().containerId).toBe('target');
    });
  });

  describe('on mount', () => {
    beforeEach(() => {
      spyOn(routeActions, 'requestViewerState').and.returnValue({ then: callback => {
          callback(['requestViewerState:action1', 'requestViewerState:action2']);
        } });
    });

    it('should loadDefaultViewerMenu()', () => {
      render({ mount: true });
      expect(context.store.dispatch).toHaveBeenCalledWith({ type: 'LOAD_DEFAULT_VIEWER_MENU' });
    });

    it('should requestViewerState to populate pdfInfo when pdf not yet rendered for the first time', () => {
      props.doc = props.doc.set('pdfInfo', undefined);
      render({ mount: true });

      expect(routeActions.requestViewerState).toHaveBeenCalledWith(new _RequestParams.RequestParams({ sharedId: 'sharedId' }), { templates: [] });
      expect(context.store.dispatch).toHaveBeenCalledWith('requestViewerState:action1');
      expect(context.store.dispatch).toHaveBeenCalledWith('requestViewerState:action2');
    });
  });
});