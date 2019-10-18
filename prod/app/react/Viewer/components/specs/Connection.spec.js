"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");
var _immutable = _interopRequireDefault(require("immutable"));

var _Connection = require("../Connection");
var _Layout = require("../../../Layout");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('Connection', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      reference: { _id: 'ref1', relationType: 'rel1', associatedRelationship: { entityData: { _id: '1' } }, range: { start: 10, end: 20 } },
      referencedDocuments: _immutable.default.fromJS([{ title: 'doc1', _id: '1' }, { title: 'doc2', _id: '2' }]),
      relationTypes: _immutable.default.fromJS([{ _id: 'rel1', name: 'Supports' }]),
      highlightReference: jasmine.createSpy('highlightReference'),
      activateReference: jasmine.createSpy('activateReference'),
      selectReference: jasmine.createSpy('selectReference'),
      deactivateReference: jasmine.createSpy('deactivateReference'),
      deleteReference: jasmine.createSpy('deleteReference'),
      active: true,
      highlighted: false,
      doc: { pdfInfo: '' } };

  });

  const render = () => {
    component = (0, _enzyme.shallow)(_react.default.createElement(_Connection.Connection, props));
  };

  it('should render the reference', () => {
    render();
    expect(component).toMatchSnapshot();
  });

  it('should disable all-document connections if targetDocument', () => {
    props.targetDoc = true;
    props.reference.range = {};
    render();

    expect(component.find(_Layout.Item).get(0).props.className).toContain('disabled');
  });

  describe('when mouseenter on a reference', () => {
    it('should highlightReference', () => {
      render();
      component.find(_Layout.Item).last().simulate('mouseenter');
      expect(props.highlightReference).toHaveBeenCalledWith('ref1');
    });
  });

  describe('when mouseleave a reference', () => {
    it('should unhighlightReference', () => {
      render();
      component.find(_Layout.Item).last().simulate('mouseleave');
      expect(props.highlightReference).toHaveBeenCalledWith(null);
    });
  });

  describe('when click on a reference', () => {
    beforeEach(() => {
      props.uiState = _immutable.default.fromJS({
        reference: _immutable.default.fromJS({ targetRange: 'targetRange' }),
        panel: 'ConnectionsList',
        activeReference: 'ref1' });

      props.referencesSection = 'tabName';
    });

    describe('when document is source document', () => {
      it('should activate it', () => {
        render();
        component.find(_Layout.Item).simulate('click');
        expect(props.activateReference).toHaveBeenCalledWith(props.reference, props.doc.pdfInfo, 'tabName');
        expect(component.find(_Layout.Item).props().className).toContain('relationship-active');
      });

      describe('when readOnly', () => {
        it('should not activate it', () => {
          props.readOnly = true;
          render();
          component.find(_Layout.Item).last().simulate('click');
          expect(props.activateReference).not.toHaveBeenCalled();
          expect(component.find(_Layout.Item).props().className).not.toContain('relationship-active');
        });
      });
    });

    describe('when document is target document', () => {
      it('should select it', () => {
        props.targetDoc = true;
        props.targetRange = {};
        render();
        component.find(_Layout.Item).last().simulate('click');
        expect(props.selectReference).toHaveBeenCalledWith(props.reference, '');
        expect(component.find(_Layout.Item).last().getElements()[0].props.className).toContain('relationship-selected');
      });

      describe('when connection is to the entire document', () => {
        it('should not select it', () => {
          props.targetDoc = true;
          props.reference.range = {};
          render();
          component.find(_Layout.Item).first().simulate('click');
          expect(props.selectReference).not.toHaveBeenCalled();
        });
      });
    });
  });
});