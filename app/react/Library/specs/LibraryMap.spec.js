import React from 'react';
import { shallow } from 'enzyme';
import { LibraryMapComponent } from '#app/Library/LibraryMap.js';
import RouteHandler from '#app/App/RouteHandler.js';
import { MapView } from '#app/Library/components/MapView.js';
import LibraryModeToggleButtons from '#app/Library/components/LibraryModeToggleButtons.js';

jest.mock('#app/appRoutes');

describe('LibraryMap', () => {
  let component;

  beforeEach(() => {
    RouteHandler.renderedFromServer = true;
    const props = { location: { query: { q: '(a:1)' } } };
    const context = { store: { getState: () => ({}), dispatch: jasmine.createSpy('dispatch') } };

    component = shallow(<LibraryMapComponent {...props} />, { context });
  });

  it('should render the MapView', () => {
    expect(component.find(MapView).props().storeKey).toBe('library');
  });

  it('should enable mapViewMode', () => {
    const libraryMode = component.find(LibraryModeToggleButtons);
    expect(libraryMode.props().mapViewMode).toBe(true);
  });
});
