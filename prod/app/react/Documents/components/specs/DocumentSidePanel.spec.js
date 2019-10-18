"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");
var _immutable = _interopRequireWildcard(require("immutable"));

var _ConnectionsList = require("../../../ConnectionsList");
var _SidePanel = _interopRequireDefault(require("../../../Layout/SidePanel"));
var _ConnectionsList2 = _interopRequireDefault(require("../../../Viewer/components/ConnectionsList"));
var _reactTabsRedux = require("react-tabs-redux");
var viewerModule = _interopRequireWildcard(require("../../../Viewer"));

var _DocumentSidePanel = require("../DocumentSidePanel");function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('DocumentSidePanel', () => {
  let component;
  let props;
  const context = {
    confirm: jasmine.createSpy('confirm') };


  beforeEach(() => {
    props = {
      doc: _immutable.default.fromJS({ metadata: [], attachments: [], type: 'document', file: {} }),
      rawDoc: (0, _immutable.fromJS)({}),
      showModal: jasmine.createSpy('showModal'),
      openPanel: jasmine.createSpy('openPanel'),
      startNewConnection: jasmine.createSpy('startNewConnection'),
      showTab: jasmine.createSpy('showTab'),
      closePanel: jasmine.createSpy('closePanel'),
      deleteDocument: jasmine.createSpy('deleteDocument'),
      resetForm: jasmine.createSpy('resetForm'),
      excludeConnectionsTab: true,
      storeKey: 'library',
      references: _immutable.default.fromJS(['reference']),
      connections: _immutable.default.fromJS(['connections']),
      formPath: 'formPath',
      connectionsGroups: _immutable.default.fromJS([
      { templates: [{ count: 1 }, { count: 2 }] },
      { templates: [{ count: 3 }, { count: 4 }] }]) };


  });

  const render = () => {
    component = (0, _enzyme.shallow)(_react.default.createElement(_DocumentSidePanel.DocumentSidePanel, props), { context });
  };

  it('should have default props values assigned', () => {
    render();
    expect(component.instance().props.tocFormComponent()).toBe(false);
    expect(component.instance().props.EntityForm()).toBe(false);
  });

  it('should render a SidePanel', () => {
    render();

    expect(component.find(_SidePanel.default).length).toBe(1);
    expect(component.find(_SidePanel.default).props().open).toBeUndefined();
  });

  describe('when props.open', () => {
    it('should open SidePanel', () => {
      props.open = true;
      render();

      expect(component.find(_SidePanel.default).props().open).toBe(true);
    });
  });

  describe('connections', () => {
    it('should render 2 connections sections, for connections and references', () => {
      expect(component.find(_ConnectionsList2.default).at(0).props().references).toEqual(props.references);
      expect(component.find(_ConnectionsList.ConnectionsGroups).length).toBe(1);
    });
  });

  describe('Tabs', () => {
    it('should set tab in props as selected', () => {
      props.tab = 'selected-tab';
      render();
      expect(component.find(_reactTabsRedux.Tabs).at(0).props().selectedTab).toBe('selected-tab');
    });

    describe('when doc passed is an entity', () => {
      it('should set metadata as selected if tab is toc', () => {
        props.doc = _immutable.default.fromJS({ metadata: [], attachments: [], type: 'entity' });
        props.tab = 'toc';
        render();
        expect(component.find(_reactTabsRedux.Tabs).at(0).props().selectedTab).toBe('metadata');
      });
      it('should set metadata as selected if tab is references', () => {
        props.doc = _immutable.default.fromJS({ metadata: [], attachments: [], type: 'entity' });
        props.tab = 'references';
        render();
        expect(component.find(_reactTabsRedux.Tabs).at(0).props().selectedTab).toBe('metadata');
      });
    });
  });

  describe('close', () => {
    describe('when form is dirty', () => {
      it('should confirm', () => {
        props.formDirty = true;
        render();
        component.find('.close-modal').simulate('click');
        expect(context.confirm).toHaveBeenCalled();
      });
    });

    describe('when form is not dirty', () => {
      it('should close panel and reset form', () => {
        props.closePanel = jasmine.createSpy('closePanel');
        props.resetForm = jasmine.createSpy('resetForm');
        props.formDirty = false;
        props.docBeingEdited = true;
        props.formPath = 'formPath';
        render();

        component.find('.close-modal').simulate('click');

        expect(props.closePanel).toHaveBeenCalled();
        expect(props.resetForm).toHaveBeenCalledWith('formPath');
      });
    });
  });

  describe('mapStateToProps', () => {
    let state;

    beforeEach(() => {
      state = {
        documentViewer: { targetDoc: _immutable.default.fromJS({ _id: null }) },
        relationships: { list: { connectionsGroups: 'connectionsGroups' } },
        relationTypes: _immutable.default.fromJS(['a', 'b']) };

      spyOn(viewerModule.selectors, 'parseReferences').and.callFake((doc, refs) => `Parsed ${doc} refs: ${refs}`);
      spyOn(viewerModule.selectors, 'selectReferences').and.
      callFake(fakeState => `References selector used ${fakeState === state ? 'correctly' : 'incorrectly'}`);
      spyOn(viewerModule.selectors, 'selectTargetReferences').and.
      callFake(fakeState => `Target references selector used ${fakeState === state ? 'correctly' : 'incorrectly'}`);
    });

    it('should map parsed references from ownProps if present and set the excludeConnectionsTab to true', () => {
      const ownProps = { doc: 'fullDocData', references: 'allRefs' };
      expect((0, _DocumentSidePanel.mapStateToProps)(state, ownProps).references).toBe('Parsed fullDocData refs: allRefs');
      expect((0, _DocumentSidePanel.mapStateToProps)(state, ownProps).excludeConnectionsTab).toBe(true);
    });

    it('should map selected references from viewer when no ownProps and not targetDoc', () => {
      const ownProps = {};
      expect((0, _DocumentSidePanel.mapStateToProps)(state, ownProps).references).toBe('References selector used correctly');
      expect((0, _DocumentSidePanel.mapStateToProps)(state, ownProps).excludeConnectionsTab).toBe(false);
    });

    it('should map selected target references from viewer when no ownProps and targetDoc', () => {
      const ownProps = {};
      state.documentViewer.targetDoc = _immutable.default.fromJS({ _id: 'targetDocId' });
      expect((0, _DocumentSidePanel.mapStateToProps)(state, ownProps).references).toBe('Target references selector used correctly');
      expect((0, _DocumentSidePanel.mapStateToProps)(state, ownProps).excludeConnectionsTab).toBe(false);
    });

    it('should map connectionsGroups', () => {
      const ownProps = {};
      expect((0, _DocumentSidePanel.mapStateToProps)(state, ownProps).connectionsGroups).toBe('connectionsGroups');
    });
  });
});