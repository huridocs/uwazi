import React from 'react';
import {shallow} from 'enzyme';
import {fromJS as Immutable} from 'immutable';

import {EntityViewer} from '../EntityViewer';

import ReferencesGroup from '../ReferencesGroup';

describe('EntityViewer', () => {
  let component;
  let props;
  let context;
  let instance;

  beforeEach(() => {
    context = {confirm: jasmine.createSpy('confirm')};
    props = {
      entity: {title: 'Title'},
      templates: [
        {_id: 'template1', properties: [{name: 'source_property', label: 'label1'}], name: 'template1Name'},
        {_id: 'template2', properties: [{name: 'source_property', label: 'label2'}], name: 'template2Name'}
      ],
      relationTypes: [{_id: 'abc', name: 'relationTypeName'}],
      references: Immutable([
        {_id: 'ref1', connectedDocumentTemplate: 'template1', relationType: 'abc'},
        {_id: 'ref2', connectedDocumentTemplate: 'template1', sourceType: 'metadata', sourceProperty: 'source_property'},
        {_id: 'ref5', relationType: 'abc'},
        {_id: 'ref3', connectedDocumentTemplate: 'template2', sourceType: 'metadata', sourceProperty: 'source_property'},
        {_id: 'ref4', connectedDocumentTemplate: 'template1', sourceType: 'metadata', sourceProperty: 'source_property'}
      ]),
      deleteReference: jasmine.createSpy('deleteReference'),
      startNewConnection: jasmine.createSpy('startNewConnection')
    };
  });

  let render = () => {
    component = shallow(<EntityViewer {...props} />, {context});
    instance = component.instance();
  };

  describe('groupReferences', () => {
    it('should group the references based on the sourceProperty/connectionType and documentType', () => {
      render();
      const groupedReferences = instance.groupReferences();

      expect(groupedReferences.length).toBe(3);

      expect(groupedReferences[0].key).toBe('abc');
      expect(groupedReferences[0].connectionType).toBe('connection');
      expect(groupedReferences[0].connectionLabel).toBe('relationTypeName');
      expect(groupedReferences[0].templateLabel).toBeUndefined();
      expect(groupedReferences[0].refs).toEqual([props.references.toJS()[0], props.references.toJS()[2]]);

      expect(groupedReferences[1].key).toBe('source_property-template1');
      expect(groupedReferences[1].connectionType).toBe('metadata');
      expect(groupedReferences[1].connectionLabel).toBe('label1');
      expect(groupedReferences[1].templateLabel).toBe('template1Name');
      expect(groupedReferences[1].refs).toEqual([props.references.toJS()[1], props.references.toJS()[4]]);

      expect(groupedReferences[2].key).toBe('source_property-template2');
      expect(groupedReferences[2].connectionType).toBe('metadata');
      expect(groupedReferences[2].connectionLabel).toBe('label2');
      expect(groupedReferences[2].templateLabel).toBe('template2Name');
      expect(groupedReferences[2].refs).toEqual([props.references.toJS()[3]]);
    });

    it('should render the groupedReferences', () => {
      render();
      const groupedReferences = instance.groupReferences();

      const ref1 = component.find(ReferencesGroup).at(0);
      const ref2 = component.find(ReferencesGroup).at(1);
      const ref3 = component.find(ReferencesGroup).at(2);

      expect(ref1.props().group.toJS()).toEqual(groupedReferences[0]);
      expect(ref2.props().group.toJS()).toEqual(groupedReferences[1]);
      expect(ref3.props().group.toJS()).toEqual(groupedReferences[2]);
    });
  });

  describe('deleteReference', () => {
    beforeEach(() => {
      render();
    });

    it('should confirm deleting a Reference', () => {
      instance.deleteReference({});
      expect(context.confirm).toHaveBeenCalled();
      expect(props.deleteReference).not.toHaveBeenCalled();
    });

    it('should delete the reference upon accepting', () => {
      const ref1 = component.find(ReferencesGroup).at(0);
      ref1.props().deleteReference(props.references.toJS()[0]);
      context.confirm.calls.argsFor(0)[0].accept();
      expect(props.deleteReference).toHaveBeenCalledWith(props.references.toJS()[0]);
    });

    it('should not atempt to delete references whos source is metadata', () => {
      const ref2 = component.find(ReferencesGroup).at(1);
      ref2.props().deleteReference(props.references.toJS()[4]);
      expect(context.confirm).not.toHaveBeenCalled();
      expect(props.deleteReference).not.toHaveBeenCalled();
    });
  });
});
