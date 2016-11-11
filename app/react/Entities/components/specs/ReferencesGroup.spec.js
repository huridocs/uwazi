import React from 'react';
import {shallow} from 'enzyme';
import {is, fromJS as Immutable} from 'immutable';
import advancedSortUtil from 'app/utils/advancedSort';

import {NeedAuthorization} from 'app/Auth';
import {I18NLink} from 'app/I18N';

import {ReferencesGroup, mapStateToProps} from '../ReferencesGroup';
import {Item} from 'app/Layout';

describe('ReferencesGroup', () => {
  let component;
  let props;
  let references;

  beforeEach(() => {
    references = [{
      sourceType: 'metadata',
      connectedDocument: 'id1',
      connectedDocumentTitle: 'title1',
      connectedDocumentIcon: 'icon1',
      connectedDocumentType: 'entity',
      connectedDocumentTemplate: 'template1',
      connectedDocumentCreationDate: 123,
      connectedDocumentPublished: true,
      connectedDocumentMetadata: {data: 'a'},
      text: 'text1'
    }, {
      sourceType: 'not metadata',
      connectedDocument: 'id2',
      connectedDocumentTitle: 'title2',
      connectedDocumentIcon: 'icon2',
      connectedDocumentType: 'document',
      connectedDocumentTemplate: 'template2',
      connectedDocumentCreationDate: 456,
      connectedDocumentPublished: false,
      connectedDocumentMetadata: {data: 'b'},
      text: 'text2'
    }];

    spyOn(advancedSortUtil, 'advancedSort').and.callFake(normalizedReferences => normalizedReferences);

    props = {
      group: Immutable({refs: references}),
      deleteReference: jasmine.createSpy('deleteReference'),
      sort: Immutable({sort: 'metadata.date', order: 'desc', treatAs: 'number'})
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
      expect(component.find(Item).length).toBe(0);
    });

    it('should toggle the expanded state', () => {
      render();
      component.find('button').simulate('click');
      expect(component.find('.item-group-header').props().className).toContain('is-expanded');
      expect(component.find('.item-group-header').props().className).not.toContain('is-collapsed');
      expect(component.find(Item).length).toBe(2);

      const expectedItem1 = {
        sharedId: 'id1',
        creationDate: 123,
        published: true,
        metadata: {data: 'a'},
        title: 'title1',
        icon: 'icon1',
        template: 'template1',
        type: 'entity'
      };

      const expectedItem2 = {
        sharedId: 'id2',
        creationDate: 456,
        published: false,
        metadata: {data: 'b'},
        title: 'title2',
        icon: 'icon2',
        template: 'template2',
        type: 'document'
      };

      expect(component.find(Item).at(0).props().doc.toJS()).toEqual(expectedItem1);
      expect(component.find(Item).at(1).props().doc.toJS()).toEqual(expectedItem2);
    });

    it('should allow deleting a metadata reference only to authorized users', () => {
      render();
      component.find('button').simulate('click');

      const deleteRef1 = shallow(component.find(Item).at(0).props().buttons).find('a');
      const deleteRef2 = shallow(component.find(Item).at(1).props().buttons).find('a');

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

      const linkRef1 = shallow(component.find(Item).at(0).props().buttons).find(I18NLink);
      const linkRef2 = shallow(component.find(Item).at(1).props().buttons).find(I18NLink);

      expect(linkRef1.props().to).toBe('/entity/id1');
      expect(linkRef2.props().to).toBe('/document/id2');
    });
  });

  describe('Sorting criteria', () => {
    it('should sort the results according to the passed sort data', () => {
      render();
      expect(advancedSortUtil.advancedSort.calls.argsFor(0)[1]).toEqual({property: ['doc', 'metadata', 'date'], order: 'desc', treatAs: 'number'});

      props.sort = Immutable({sort: 'title', order: 'asc', treatAs: 'string'});
      render();
      expect(advancedSortUtil.advancedSort.calls.argsFor(1)[1]).toEqual({property: ['doc', 'title'], order: 'asc', treatAs: 'string'});
    });
  });

  describe('mapStateToProps', () => {
    it('should map entityViewer.sort to sort as Immutable', () => {
      const state = {entityView: {sort: {a: 'b'}}};
      expect(is(mapStateToProps(state).sort, Immutable(state.entityView.sort))).toBe(true);
    });
  });
});
