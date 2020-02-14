import React from 'react';
import { shallow } from 'enzyme';
import LibraryMap from 'app/Library/LibraryMap';
import RouteHandler from 'app/App/RouteHandler';
import MapView from 'app/Library/components/MapView';
import LibraryModeToggleButtons from 'app/Library/components/LibraryModeToggleButtons';

describe('LibraryMap', () => {
  let component;
  let instance;

  beforeEach(() => {
    RouteHandler.renderedFromServer = true;
    const props = { location: { query: { q: '(a:1)' } } };
    const context = { store: { getState: () => ({}), dispatch: jasmine.createSpy('dispatch') } };

    component = shallow(<LibraryMap {...props} />, { context });
    instance = component.instance();
  });

  it('should render the MapView', () => {
    expect(component.find(MapView).props().storeKey).toBe('library');
  });

  it('should include the Toggle Buttons with zoom in and out functionality', () => {
    const zoomIn = jasmine.createSpy('zoomIn');
    const zoomOut = jasmine.createSpy('zoomOut');

    instance.mapView = { getWrappedInstance: () => ({ map: { zoomIn, zoomOut } }) };
    const libraryButtons = component.find(LibraryModeToggleButtons);

    expect(libraryButtons.props().zoomLevel).toBe(0);
    expect(libraryButtons.props().storeKey).toBe('library');

    expect(zoomIn).not.toHaveBeenCalled();
    expect(zoomOut).not.toHaveBeenCalled();

    libraryButtons.props().zoomIn();
    expect(zoomIn).toHaveBeenCalled();
    expect(zoomOut).not.toHaveBeenCalled();

    libraryButtons.props().zoomOut();
    expect(zoomOut).toHaveBeenCalled();
  });
});
