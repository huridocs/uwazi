import React from 'react';
import { shallow } from 'enzyme';
import LibraryTable from 'app/Library/Library';
import RouteHandler from 'app/App/RouteHandler';
import DocumentsList from 'app/Library/components/DocumentsList';

describe('LibraryTable', () => {
  let component;
  let context;
  const props = { location: { query: { q: '(a:1)' } } };
  const dispatchCallsOrder = [];

  beforeEach(() => {
    RouteHandler.renderedFromServer = true;
    context = {
      store: {
        getState: () => ({}),
        dispatch: jasmine.createSpy('dispatch').and.callFake(action => {
          dispatchCallsOrder.push(action.type);
        }),
      },
    };

    component = shallow(<LibraryTable {...props} />, { context });
  });

  it('should render the DocumentsList (by default)', () => {
    expect(component.find(DocumentsList).length).toBe(1);
    expect(component.find(DocumentsList).props().storeKey).toBe('library');
  });
});
