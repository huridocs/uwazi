import React from 'react';
import {shallow} from 'enzyme';
import {is, fromJS as Immutable} from 'immutable';
import advancedSortUtil from 'app/utils/advancedSort';

import {NeedAuthorization} from 'app/Auth';
import {I18NLink} from 'app/I18N';

import {ReferencesGroup, mapStateToProps} from '../ReferencesGroup';
import {Item} from 'app/Layout';
import ShowIf from 'app/App/ShowIf';

describe('ReferencesGroup', () => {
  let component;
  let props;
  let group;

  beforeEach(() => {
    group = {
      key: 'g1',
      templates: [
        {_id: 't1', label: 'template 1', count: 1},
        {_id: 't2', label: 'template 2', count: 2}
      ]
    };

    props = {
      group: Immutable(group),
      setFilter: jasmine.createSpy('setFilter')
    };
  });

  let render = () => {
    component = shallow(<ReferencesGroup {...props} />);
  };

  fit('should render the group multiselect item with checked state, types count and collapsed', () => {
    render();
    expect(component.find('input').at(0).props().checked).toBe(false);
    expect(component.find('.multiselectItem-results').find('span').at(0).text()).toBe('3');
    expect(component.find(ShowIf).props().if).toBe(false);
  });

  describe('when the group is expanded', () => {
    let subItem1;
    let subItem2;

    beforeEach(() => {
      render();
      component.find('.multiselectItem-results').find('span').at(2).simulate('click');
      subItem1 = component.find('ul').find('li').at(0);
      subItem2 = component.find('ul').find('li').at(1);
    });

    fit('should render the group templates', () => {
      expect(component.find(ShowIf).props().if).toBe(true);
      expect(component.find('ul').find('li').length).toBe(2);

      expect(subItem1.props().title).toBe('template 1');
      expect(subItem1.find('input').props().checked).toBe(false);
      expect(subItem1.find('.multiselectItem-name').text()).toBe('template 1');
      expect(subItem1.find('.multiselectItem-results').text()).toBe('1');

      expect(subItem2.props().title).toBe('template 2');
      expect(subItem2.find('input').props().checked).toBe(false);
      expect(subItem2.find('.multiselectItem-name').text()).toBe('template 2');
      expect(subItem2.find('.multiselectItem-results').text()).toBe('2');
    });

    fit('should allow selecting a single item', () => {
      component.find('ul').find('li').at(1).find('input').simulate('change');
      subItem1 = component.find('ul').find('li').at(0);
      subItem2 = component.find('ul').find('li').at(1);

      expect(subItem1.find('input').props().checked).toBe(false);
      expect(subItem2.find('input').props().checked).toBe(true);
      expect(props.setFilter.calls.argsFor(0)[0].g1.toJS()).toEqual(['g1t2']);
    });

    describe('When selecting all sub items', () => {
      fit('should select also the entire group', () => {
        expect(component.find('input').at(0).props().checked).toBe(false);

        component.find('ul').find('li').at(0).find('input').simulate('change');
        component.find('ul').find('li').at(1).find('input').simulate('change');
        subItem1 = component.find('ul').find('li').at(0);
        subItem2 = component.find('ul').find('li').at(1);

        expect(component.find('input').at(0).props().checked).toBe(true);
        expect(subItem1.find('input').props().checked).toBe(true);
        expect(subItem2.find('input').props().checked).toBe(true);
        expect(props.setFilter.calls.argsFor(0)[0].g1.toJS()).toEqual(['g1t2']);
      });
    });
  });

  describe('when selecting the entire group', () => {
    fit('should allow expanding the multiselect group', () => {
      render();
      component.find('input').at(0).simulate('change');
      expect(component.find('input').at(0).props().checked).toBe(true);
    });
  });


  describe('groupReferences', () => {
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

    it('should pass the searchParams to the item for proper rendering', () => {
      render();
      component.find('button').simulate('click');
      const item1 = component.find(Item).at(0);
      expect(item1.props().searchParams).toEqual(props.sort.toJS());
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
