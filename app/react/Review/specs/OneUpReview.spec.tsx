import RouteHandler from 'app/App/RouteHandler';
import { Loader } from 'app/components/Elements/Loader';
import { OneUpState } from 'app/istore';
import { OneUpEntityViewer } from 'app/Review/components/OneUpEntityViewer';
import { OneUpReviewBase, OneUpReviewProps } from 'app/Review/OneUpReview';
import createStore from 'app/store';
import { shallow, ShallowWrapper } from 'enzyme';
import Immutable from 'immutable';
import React from 'react';

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
  } as OneUpState);
  createStore({ templates, thesauris, entityView: { entity }, oneUpReview: { state: oneUpState } });
  let component: ShallowWrapper<OneUpReviewProps, {}, OneUpReviewBase>;
  let context = {};
  let props: OneUpReviewProps;
  let dispatchCallsOrder = [];

  beforeEach(() => {
    RouteHandler.renderedFromServer = true;
    props = {
      entity,
      oneUpState,
      location: { search: { q: '(a:1)' } },
      mainContext: { confirm: jest.fn },
    };
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
      const nextProps = { location: { search: { q: '(a:2)' } } };
      expect(component.instance().urlHasChanged(nextProps)).toBe(true);
    });

    it('should not update if "q" is the same', () => {
      render();
      const nextProps = { location: { search: { q: '(a:1)' } } };
      expect(component.instance().urlHasChanged(nextProps)).toBe(false);
    });
  });
});
