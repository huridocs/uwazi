import React from 'react';
import {shallow} from 'enzyme';
import {fromJS as immutable} from 'immutable';

import {EntityViewer} from '../EntityViewer';

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
      references: immutable([
        {_id: 'ref1', connectedDocumentTemplate: 'template1', relationType: 'abc'},
        {_id: 'ref2', connectedDocumentTemplate: 'template1', sourceType: 'metadata', sourceProperty: 'source_property'},
        {_id: 'ref5', relationType: 'abc'},
        {_id: 'ref3', connectedDocumentTemplate: 'template2', sourceType: 'metadata', sourceProperty: 'source_property'},
        {_id: 'ref4', connectedDocumentTemplate: 'template1', sourceType: 'metadata', sourceProperty: 'source_property'}
      ]),
      deleteReference: jasmine.createSpy('deleteReference'),
      openConnectionsPanel: jasmine.createSpy('openConnectionsPanel')
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

      expect(groupedReferences.length).toBe(4);

      expect(groupedReferences[0].key).toBe('abc-template1');
      expect(groupedReferences[0].connectionType).toBe('connection');
      expect(groupedReferences[0].connectionLabel).toBe('relationTypeName');
      expect(groupedReferences[0].templateLabel).toBe('template1Name');
      expect(groupedReferences[0].refs).toEqual([props.references.toJS()[0]]);

      expect(groupedReferences[1].key).toBe('source_property-template1');
      expect(groupedReferences[1].connectionType).toBe('metadata');
      expect(groupedReferences[1].connectionLabel).toBe('label1');
      expect(groupedReferences[1].templateLabel).toBe('template1Name');
      expect(groupedReferences[1].refs).toEqual([props.references.toJS()[1], props.references.toJS()[4]]);

      expect(groupedReferences[2].key).toBe('abc-undefined');
      expect(groupedReferences[2].connectionType).toBe('connection');
      expect(groupedReferences[2].connectionLabel).toBe('relationTypeName');
      expect(groupedReferences[2].templateLabel).toBe('documents without metadata');
      expect(groupedReferences[2].refs).toEqual([props.references.toJS()[2]]);

      expect(groupedReferences[3].key).toBe('source_property-template2');
      expect(groupedReferences[3].connectionType).toBe('metadata');
      expect(groupedReferences[3].connectionLabel).toBe('label2');
      expect(groupedReferences[3].templateLabel).toBe('template2Name');
      expect(groupedReferences[3].refs).toEqual([props.references.toJS()[3]]);
    });
  });

  describe('deleteReference', () => {
    beforeEach(() => {
      render();
    });

    it('should confirm deleting a Reference', () => {
      component.find('.item-actions').find('a').first().props().onClick();
      expect(context.confirm).toHaveBeenCalled();
      expect(props.deleteReference).not.toHaveBeenCalled();
    });

    it('should delete the reference upon accepting', () => {
      component.find('.item-actions').find('a').first().props().onClick();
      context.confirm.calls.argsFor(0)[0].accept();
      expect(props.deleteReference).toHaveBeenCalledWith(props.references.toJS()[0]);
    });

    it('should not atempt to delete references whos source is metadata', () => {
      component.find('.item-actions').find('a').last().props().onClick();
      expect(context.confirm).not.toHaveBeenCalled();
      expect(props.deleteReference).not.toHaveBeenCalled();
    });
  });
});
