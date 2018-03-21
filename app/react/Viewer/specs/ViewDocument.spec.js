import React from 'react';
import {shallow} from 'enzyme';

import Viewer from 'app/Viewer/components/Viewer';
import ViewDocument from 'app/Viewer/ViewDocument';

import * as routeActions from '../actions/routeActions';
import * as relationships from 'app/Relationships/utils/routeUtils';

describe('ViewDocument', () => {
  let component;
  let instance;
  let context;

  beforeEach(() => {
    const dispatch = jasmine.createSpy('dispatch');
    context = {store: {dispatch: dispatch.and.callFake(action => {
      if (typeof action === 'function') {
        return action(dispatch);
      }
      return action;
    })}};
    let props = {
      location: {query: {}}
    };
    component = shallow(<ViewDocument {...props} renderedFromServer={true} />, {context});
    instance = component.instance();

    spyOn(routeActions, 'requestViewerState').and.callFake((documentId, lang, globalResources) => {
      return {documentId, lang, globalResources};
    });

    spyOn(routeActions, 'setViewerState').and.returnValue({type: 'setViewerState'});
  });

  it('should render the Viewer', () => {
    expect(component.find(Viewer).length).toBe(1);
  });

  describe('static requestState', () => {
    it('should call on requestViewerState', () => {
      expect(ViewDocument.requestState({documentId: 'documentId', lang: 'es'}, null, 'globalResources'))
      .toEqual({documentId: 'documentId', lang: 'es', globalResources: 'globalResources'});
    });
  });

  describe('setReduxState()', () => {
    it('should dispatch setViewerState', () => {
      instance.setReduxState('state');
      expect(routeActions.setViewerState).toHaveBeenCalledWith('state');
      expect(context.store.dispatch).toHaveBeenCalledWith({type: 'setViewerState'});
    });
  });

  describe('componentWillUnmount()', () => {
    it('should call emptyState', () => {
      spyOn(instance, 'emptyState');
      instance.componentWillUnmount();

      expect(instance.emptyState).toHaveBeenCalled();
    });
  });

  describe('emptyState()', () => {
    beforeEach(() => {
      spyOn(relationships, 'emptyState').and.returnValue({type: 'relationshipsEmptyState'});
    });

    it('should unset the state', () => {
      instance.emptyState();
      expect(context.store.dispatch).toHaveBeenCalledWith({type: 'SET_REFERENCES', references: []});
      expect(context.store.dispatch).toHaveBeenCalledWith({type: 'viewer/doc/UNSET'});
      expect(context.store.dispatch).toHaveBeenCalledWith({type: 'viewer/templates/UNSET'});
      expect(context.store.dispatch).toHaveBeenCalledWith({type: 'viewer/thesauris/UNSET'});
      expect(context.store.dispatch).toHaveBeenCalledWith({type: 'viewer/relationTypes/UNSET'});
      expect(context.store.dispatch).toHaveBeenCalledWith({type: 'rrf/reset', model: 'documentViewer.tocForm'});
      expect(context.store.dispatch).toHaveBeenCalledWith({type: 'viewer/targetDoc/UNSET'});
      expect(context.store.dispatch).toHaveBeenCalledWith({type: 'relationshipsEmptyState'});
    });
  });
});
