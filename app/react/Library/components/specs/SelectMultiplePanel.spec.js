import React from 'react';
import {shallow} from 'enzyme';

import {SelectMultiplePanel} from '../SelectMultiplePanel';
import {TemplateLabel, SidePanel} from 'app/Layout';
import Immutable from 'immutable';

describe('SelectMultiplePanel', () => {
  let component;
  let props;
  let context;

  beforeEach(() => {
    props = {
      entitiesSelected: Immutable.fromJS([{title: 'A rude awakening', template: '1'}, {title: 'A falling star', template: '1'}]),
      unselectAllDocuments: jasmine.createSpy('unselectAllDocuments'),
      deleteEntities: jasmine.createSpy('deleteEntities')
    };
    context = {confirm: jasmine.createSpy('confirm')};
  });

  let render = () => {
    component = shallow(<SelectMultiplePanel {...props}/>, {context});
  };

  it('should render a SidePanel', () => {
    render();
    expect(component.find(SidePanel).length).toBe(1);
    expect(component.find(SidePanel).props().open).toBeUndefined();
  });

  it('should render a list of documents with a TemplateLabel', () => {
    render();
    expect(component.find(TemplateLabel).length).toBe(2);
    expect(component.find('.entities-list li span').first().text()).toBe('A rude awakening');
    expect(component.find('.entities-list li span').last().text()).toBe('A falling star');
  });

  describe('when props.open', () => {
    it('should open SidePanel', () => {
      props.open = true;
      render();
      expect(component.find(SidePanel).props().open).toBe(true);
    });
  });

  describe('close()', () => {
    it('should confirm before closing', () => {
      render();
      component.find('.close-modal').simulate('click');
      expect(context.confirm).toHaveBeenCalled();
      context.confirm.calls.mostRecent().args[0].accept();
      expect(props.unselectAllDocuments).toHaveBeenCalled();
    });
  });

  describe('delete()', () => {
    it('should confirm before deleting all the selectedEntities', () => {
      render();
      component.find('.delete').simulate('click');
      expect(context.confirm).toHaveBeenCalled();
      context.confirm.calls.mostRecent().args[0].accept();
      expect(props.deleteEntities).toHaveBeenCalledWith(props.entitiesSelected.toJS());
    });
  });
});
