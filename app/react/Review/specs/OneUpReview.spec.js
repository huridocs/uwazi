/** @format */

import React from 'react';
import { shallow } from 'enzyme';
import { OneUpReviewBase } from 'app/Review/OneUpReview';
import RouteHandler from 'app/App/RouteHandler';
import OneUpEntityViewer from 'app/Review/components/OneUpEntityViewer';
import Loader from 'app/components/Elements/Loader';
import createStore from 'app/store';
import Immutable from 'immutable';

describe('Library', () => {
  const templates = Immutable.fromJS([
    {
      name: 'Decision',
      _id: 'abc1',
      properties: [{ name: 'p', filter: true, type: 'text', prioritySorting: true }],
    },
    { name: 'Ruling', _id: 'abc2', properties: [] },
  ]);
  const thesauris = Immutable.fromJS([{ name: 'countries', _id: '1', values: [] }]);
  const entity = Immutable.fromJS({
    _id: 'dedd',
    template: 'abc1',
    metadata: { p: [{ value: '123' }] },
  });
  const oneUpState = Immutable.fromJS({
    loaded: true,
    fullEdit: false,
    indexInDocs: 0,
    totalDocs: 10,
    reviewThesaurusName: 'Issues',
    reviewThesaurusId: 'beef',
  });
  createStore({ templates, thesauris, entityView: { entity }, oneUpReview: { state: oneUpState } });
  let component;
  let instance;
  let context;
  let props;
  let dispatchCallsOrder = [];

  beforeEach(() => {
    RouteHandler.renderedFromServer = true;
    props = { entity, oneUpState, location: { query: { q: '(a:1)' } } };
    dispatchCallsOrder = [];
    context = {
      store: {
        getState: () => ({}),
        dispatch: jasmine.createSpy('dispatch').and.callFake(action => {
          dispatchCallsOrder.push(action.type);
        }),
      },
    };
  });

  const render = () => {
    component = shallow(<OneUpReviewBase {...props} />, { context });
    instance = component.instance();
  };

  it('should render the OneUpEntityViewer (with Entity)', () => {
    render();
    expect(component.find(OneUpEntityViewer).length).toBe(1);
  });

  it('should render the Loader (without Entity)', () => {
    props.entity = undefined;
    render();
    expect(component.find(Loader).length).toBe(1);
  });

  describe('urlHasChanged', () => {
    it('return true when q has changed', () => {
      render();
      const nextProps = { location: { query: { q: '(a:2)' } } };
      expect(instance.urlHasChanged(nextProps)).toBe(true);
    });

    it('should not update if "q" is the same', () => {
      render();
      const nextProps = { location: { query: { q: '(a:1)' } } };
      expect(instance.urlHasChanged(nextProps)).toBe(false);
    });
  });
});
