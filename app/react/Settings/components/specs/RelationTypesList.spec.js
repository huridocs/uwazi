import React from 'react';
import {shallow} from 'enzyme';
import Immutable from 'immutable';

import {RelationTypesList} from '../RelationTypesList';

describe('RelationTypesList', () => {
  let component;
  let props;
  let context;

  beforeEach(() => {
    props = {
      relationTypes: Immutable.fromJS([{_id: 1, name: 'Against'}, {_id: 2, name: 'Supports'}]),
      notify: jasmine.createSpy('notify'),
      deleteRelationType: jasmine.createSpy('deleteRelationType').and.returnValue(Promise.resolve()),
      checkRelationTypeCanBeDeleted: jasmine.createSpy('checkRelationTypeCanBeDeleted').and.returnValue(Promise.resolve())
    };

    context = {
      confirm: jasmine.createSpy('confirm')
    };
  });

  let render = () => {
    component = shallow(<RelationTypesList {...props} />, {context});
  };

  describe('render', () => {
    it('should a list with the document types', () => {
      render();
      expect(component.find('ul.relation-types').find('li').length).toBe(2);
    });
  });

  describe('when deleting a relation type', () => {
    it('should check if can be deleted', (done) => {
      render();
      component.instance().deleteRelationType({_id: 1, name: 'Decision'})
      .then(() => {
        expect(props.checkRelationTypeCanBeDeleted).toHaveBeenCalled();
        done();
      });
    });

    it('should confirm the action', (done) => {
      render();
      component.instance().deleteRelationType({_id: 1, name: 'Decision'})
      .then(() => {
        expect(context.confirm).toHaveBeenCalled();
        done();
      });
    });
  });
});
