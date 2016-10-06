import React from 'react';
import {shallow} from 'enzyme';
import {fromJS} from 'immutable';

import DragDropContext, {NavlinksSettings, mapStateToProps} from '../NavlinksSettings';

import {Form} from 'react-redux-form';
import NavlinkForm from '../NavlinkForm';

describe('NavlinksSettings', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      collection: fromJS({_id: 'abc', _rev: 'xyz', name: 'name', links: [{localID: 'existingLink'}]}),
      links: [{localID: 'newLink1'}, {localID: 'newLink2'}],
      loadLinks: jasmine.createSpy('loadLinks'),
      addLink: jasmine.createSpy('addLink'),
      sortLink: jasmine.createSpy('sortLink'),
      saveLinks: jasmine.createSpy('saveLinks')
    };
    component = shallow(<NavlinksSettings {...props} />);
  });

  describe('componentWillMount', () => {
    it('should call on loadLinks with collection links', () => {
      expect(props.loadLinks).toHaveBeenCalledWith([{localID: 'existingLink'}]);
    });
  });

  it('should render a Form linked to settings.navlinksData and validated', () => {
    expect(component.find(Form).props().model).toBe('settings.navlinksData');
    expect(Object.keys(component.find(Form).props().validators['']).length).toBe(2);
  });

  it('should save links upon submit', () => {
    component.find(Form).props().onSubmit();
    expect(props.saveLinks).toHaveBeenCalledWith({_id: 'abc', _rev: 'xyz', links: props.links});
  });

  it('should disable saving if savingNavlinks', () => {
    props.savingNavlinks = true;
    component = shallow(<NavlinksSettings {...props} />);
    expect(component.find('button').first().props().disabled).toBe(true);
  });

  it('should list all existing links', () => {
    expect(component.find(NavlinkForm).length).toBe(2);
    expect(component.find(NavlinkForm).first().props().link).toBe(props.links[0]);
    expect(component.find(NavlinkForm).last().props().link).toBe(props.links[1]);
    expect(component.find(NavlinkForm).first().props().sortLink).toBe(props.sortLink);
  });

  it('should have an add button that calls on addLink with links', () => {
    component.find('a.btn-success').props().onClick();
    expect(props.addLink).toHaveBeenCalledWith(props.links);
  });

  describe('mapStateToProps', () => {
    const settings = {
      collection: fromJS({id: 'collection'}),
      navlinksData: {links: [{localID: 'existingLink'}]},
      uiState: fromJS({savingNavlinks: true})
    };

    it('should return the right props', () => {
      expect(mapStateToProps({settings}).links).toBe(settings.navlinksData.links);
      expect(mapStateToProps({settings}).collection).toBe(settings.collection);
      expect(mapStateToProps({settings}).savingNavlinks).toBe(true);
    });
  });

  describe('Drag and Drop functionality', () => {
    beforeEach(() => {
      props.store = {
        subscribe: jasmine.createSpy('subscribe'),
        dispatch: jasmine.createSpy('dispatch'),
        getState: jasmine.createSpy('getState').and.returnValue({
          settings: {collection: props.collection, navlinksData: {links: []}, uiState: {get: jasmine.createSpy('get')}}
        })};
    });

    it('should decorate the component as a Drag and Drop context', () => {
      expect(new DragDropContext().constructor.name).toBe('DragDropContextContainer');
    });
  });
});
