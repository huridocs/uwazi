import React from 'react';
import {shallow} from 'enzyme';
import advancedSortUtil from 'app/utils/advancedSort';

import {NeedAuthorization} from 'app/Auth';
import {I18NLink} from 'app/I18N';

import {ReferencesGroup} from '../ReferencesGroup';

describe('ReferencesGroup', () => {
  let component;
  let props;
  let references;

  beforeEach(() => {
    references = [
      {sourceType: 'metadata', connectedDocumentType: 'entity', connectedDocument: 'id1'},
      {sourceType: 'not metadata', connectedDocumentType: 'document', connectedDocument: 'id2'}
    ];

    spyOn(advancedSortUtil, 'advancedSort').and.returnValue(references);
    props = {
      group: {refs: []},
      deleteReference: jasmine.createSpy('deleteReference')
    };
  });

  let render = () => {
    component = shallow(<ReferencesGroup {...props} />);
  };

  describe('groupReferences', () => {
    it('should render the group collapsed', () => {
      render();
      expect(component.find('.item-group-header').props().className).toContain('is-collapsed');
      expect(component.find('.item-group-header').props().className).not.toContain('is-expanded');
    });

    it('should not show any references upon mount', () => {
      render();
      expect(component.find('.item').length).toBe(0);
    });

    it('should toggle the expanded state', () => {
      render();
      component.find('button').simulate('click');
      expect(component.find('.item-group-header').props().className).toContain('is-expanded');
      expect(component.find('.item-group-header').props().className).not.toContain('is-collapsed');
      expect(component.find('.item').length).toBe(2);
    });

    it('should allow deleting a metadata reference only to authorized users', () => {
      render();
      component.find('button').simulate('click');

      const deleteRef1 = component.find('a').at(0);
      const deleteRef2 = component.find('a').at(1);

      deleteRef1.simulate('click');
      expect(deleteRef1.parent().props().if).toBe(false);
      expect(props.deleteReference).toHaveBeenCalledWith(references[0]);

      deleteRef2.simulate('click');

      expect(deleteRef2.parent().parent().is(NeedAuthorization)).toBe(true);
      expect(deleteRef2.parent().props().if).toBe(true);
      expect(props.deleteReference).toHaveBeenCalledWith(references[1]);
    });

    it('should present a link to the reference', () => {
      render();
      component.find('button').simulate('click');

      const linkRef1 = component.find(I18NLink).at(0);
      const linkRef2 = component.find(I18NLink).at(1);

      expect(linkRef1.props().to).toBe('/entity/id1');
      expect(linkRef2.props().to).toBe('/document/id2');
    });
  });
});
