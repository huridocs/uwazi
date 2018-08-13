import React from 'react';

import { shallow } from 'enzyme';
import ViewDocument from 'app/Viewer/ViewDocument';
import Viewer from 'app/Viewer/components/Viewer';
import * as relationships from 'app/Relationships/utils/routeUtils';
import * as utils from 'app/utils';

import * as routeActions from '../actions/routeActions';

describe('ViewDocument', () => {
  let component;
  let instance;
  let context;
  let props;

  const render = () => {
    component = shallow(<ViewDocument {...props} renderedFromServer />, { context });
    instance = component.instance();
  };

  beforeEach(() => {
    const dispatch = jasmine.createSpy('dispatch');
    context = { store: { dispatch: dispatch.and.callFake((action) => {
      if (typeof action === 'function') {
        return action(dispatch);
      }
      return action;
    }) } };
    props = {
      location: { query: {} }
    };

    render();

    spyOn(routeActions, 'requestViewerState');

    spyOn(routeActions, 'setViewerState').and.returnValue({ type: 'setViewerState' });
  });

  it('should render the Viewer', () => {
    expect(component.find(Viewer).length).toBe(1);
  });

  it('should pass down raw prop', () => {
    props.location = { query: { raw: true } };
    render();
    expect(component.find(Viewer).props().raw).toBe(true);
  });

  it('should pass down page number 1 as default', () => {
    props.location = { query: { raw: true } };
    render();
    expect(component.find(Viewer).props().page).toBe(1);
  });

  describe('when on server', () => {
    it('should always pass raw true', () => {
      props.location = { query: { raw: false } };
      utils.isClient = false;
      render();
      expect(component.find(Viewer).props().raw).toBe(true);
    });
  });

  describe('static requestState', () => {
    it('should call on requestViewerState', () => {
      const query = { raw: true, page: 4 };
      ViewDocument.requestState({ documentId: 'documentId', lang: 'es' }, query, 'globalResources');

      expect(routeActions.requestViewerState).toHaveBeenCalledWith({ documentId: 'documentId', lang: 'es', raw: true, page: 4 }, 'globalResources');
    });

    it('should modify raw to true if is server side rendered', () => {
      utils.isClient = false;
      const query = { raw: false };
      ViewDocument.requestState({ documentId: 'documentId', lang: 'es' }, query, 'globalResources');
      expect(routeActions.requestViewerState).toHaveBeenCalledWith({ documentId: 'documentId', lang: 'es', raw: true }, 'globalResources');
    });
  });


  describe('setReduxState()', () => {
    it('should dispatch setViewerState', () => {
      instance.setReduxState('state');
      expect(routeActions.setViewerState).toHaveBeenCalledWith('state');
      expect(context.store.dispatch).toHaveBeenCalledWith({ type: 'setViewerState' });
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
      spyOn(relationships, 'emptyState').and.returnValue({ type: 'relationshipsEmptyState' });
    });

    it('should unset the state', () => {
      instance.emptyState();
      expect(context.store.dispatch).toHaveBeenCalledWith({ type: 'SET_REFERENCES', references: [] });
      expect(context.store.dispatch).toHaveBeenCalledWith({ type: 'viewer/doc/UNSET' });
      expect(context.store.dispatch).toHaveBeenCalledWith({ type: 'viewer/templates/UNSET' });
      expect(context.store.dispatch).toHaveBeenCalledWith({ type: 'viewer/thesauris/UNSET' });
      expect(context.store.dispatch).toHaveBeenCalledWith({ type: 'viewer/relationTypes/UNSET' });
      expect(context.store.dispatch).toHaveBeenCalledWith({ type: 'viewer/rawText/UNSET' });
      expect(context.store.dispatch).toHaveBeenCalledWith({ type: 'rrf/reset', model: 'documentViewer.tocForm' });
      expect(context.store.dispatch).toHaveBeenCalledWith({ type: 'viewer/targetDoc/UNSET' });
      expect(context.store.dispatch).toHaveBeenCalledWith({ type: 'relationshipsEmptyState' });
    });
  });
});
