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
      templates: [{
        _id: 'template1', properties: []
      }],
      references: immutable([
        {_id: 'ref1', connectedDocumentTemplate: 'template1'},
        {_id: 'ref2', connectedDocumentTemplate: 'template1', sourceType: 'metadata'}
      ]),
      deleteReference: jasmine.createSpy('deleteReference')
    };
  });

  let render = () => {
    component = shallow(<EntityViewer {...props} />, {context});
    instance = component.instance();
  };

  fdescribe('groupReferences', () => {
    it('should group the references based on the sourceProperty/connectionType and documentType', () => {
      const groupedReferences = instance.groupReferences();
      expect(true).toBe(false);
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
      expect(props.deleteReference).toHaveBeenCalledWith(props.references[0]);
    });

    it('should not atempt to delete references whos source is metadata', () => {
      component.find('.item-actions').find('a').last().props().onClick();
      expect(context.confirm).not.toHaveBeenCalled();
      expect(props.deleteReference).not.toHaveBeenCalled();
    });
  });
});
