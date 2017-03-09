import React from 'react';
import {shallow} from 'enzyme';
import {fromJS as Immutable} from 'immutable';

import {ReferencesGroup, mapStateToProps} from '../ReferencesGroup';
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

  it('should render the group multiselect item with checked state, types count and expanded', () => {
    render();
    expect(component.find('input').at(0).props().checked).toBe(false);
    expect(component.find('.multiselectItem-results').find('span').at(0).text()).toBe('3');
    expect(component.find(ShowIf).props().if).toBe(true);
  });

  describe('when the group is expanded', () => {
    let subItem1;
    let subItem2;

    beforeEach(() => {
      render();
      subItem1 = component.find('ul').find('li').at(0);
      subItem2 = component.find('ul').find('li').at(1);
    });

    it('should render the group templates', () => {
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

    it('should allow selecting a single item', () => {
      component.find('ul').find('li').at(1).find('input').simulate('change');
      subItem1 = component.find('ul').find('li').at(0);
      subItem2 = component.find('ul').find('li').at(1);

      expect(subItem1.find('input').props().checked).toBe(false);
      expect(subItem2.find('input').props().checked).toBe(true);
      expect(props.setFilter.calls.argsFor(0)[0].g1.toJS()).toEqual(['g1t2']);
    });

    describe('When selecting all sub items', () => {
      it('should select also the entire group', () => {
        expect(component.find('input').at(0).props().checked).toBe(false);

        component.find('ul').find('li').at(0).find('input').simulate('change');
        component.find('ul').find('li').at(1).find('input').simulate('change');
        subItem1 = component.find('ul').find('li').at(0);
        subItem2 = component.find('ul').find('li').at(1);

        expect(component.find('input').at(0).props().checked).toBe(true);
        expect(subItem1.find('input').props().checked).toBe(true);
        expect(subItem2.find('input').props().checked).toBe(true);
        expect(props.setFilter.calls.mostRecent().args[0].g1.toJS()).toEqual(['g1t1', 'g1t2']);
      });
    });
  });

  describe('when the group is collapsed', () => {
    beforeEach(() => {
      render();
      component.find('.multiselectItem-results').find('span').at(2).simulate('click');
    });

    it('should not show the group templates', () => {
      expect(component.find(ShowIf).props().if).toBe(false);
    });
  });

  describe('when selecting the entire group', () => {
    let subItem1;
    let subItem2;

    beforeEach(() => {
      render();
      component.find('input').at(0).simulate('change');
      subItem1 = component.find('ul').find('li').at(0);
      subItem2 = component.find('ul').find('li').at(1);
    });

    it('should select all the children of the group', () => {
      expect(component.find('input').at(0).props().checked).toBe(true);
      expect(subItem1.find('input').props(0).checked).toBe(true);
      expect(subItem2.find('input').props(0).checked).toBe(true);
      expect(props.setFilter.calls.argsFor(0)[0].g1.toJS()).toEqual(['g1t1', 'g1t2']);
    });
  });

  describe('mapStateToProps', () => {
    it('should map entityViewer.filter', () => {
      const state = {entityView: {filter: {a: 'b'}}};
      expect(mapStateToProps(state).filter).toBe(state.entityView.filter);
    });
  });
});
