import React from 'react';
import { shallow } from 'enzyme';
import Immutable from 'immutable';
import { I18NLink } from 'app/I18N';

import { HiddenColumnsDropdown } from 'app/Library/components/HiddenColumnsDropdown';
import { LibraryModeToggleButtons, mapStateToProps } from '../LibraryModeToggleButtons';

describe('LibraryModeToggleButtons', () => {
  let component;
  let props;
  let state;

  const defaultProps = {
    mapViewMode: true,
    searchUrl: '?q="asd"',
    showGeolocation: true,
    zoomIn: jasmine.createSpy('zoomIn'),
    zoomOut: jasmine.createSpy('zoomOut'),
    zoomLevel: 3,
  };

  const render = () => {
    component = shallow(<LibraryModeToggleButtons {...props} />);
  };

  describe('render()', () => {
    beforeEach(() => {
      props = defaultProps;
      render();
    });

    it('should render three links to the library: list, table and map view', () => {
      expect(component.find(I18NLink).length).toBe(3);
      expect(component.find(I18NLink).at(0).props().to).toBe('library?q="asd"');
      expect(component.find(I18NLink).at(1).props().to).toBe('library/table?q="asd"');
      expect(component.find(I18NLink).at(2).props().to).toBe('library/map?q="asd"');
    });

    it('should hold zoom buttons', () => {
      props.mapViewMode = false;
      render();
      let zoomButtons = component.find('div.list-view-mode-zoom');
      expect(zoomButtons.props().className).toContain('list-view-buttons-zoom-3');

      props.zoomLevel = 4;
      render();
      zoomButtons = component.find('div.list-view-mode-zoom');
      expect(zoomButtons.props().className).toContain('list-view-buttons-zoom-4');

      expect(props.zoomIn).not.toHaveBeenCalled();
      expect(props.zoomOut).not.toHaveBeenCalled();

      zoomButtons.find('.zoom-in').simulate('click');
      expect(props.zoomIn).toHaveBeenCalled();

      zoomButtons.find('.zoom-out').simulate('click');
      expect(props.zoomOut).toHaveBeenCalled();
    });

    describe('when showGeolocation is false', () => {
      it('should not render button map view button', () => {
        props.showGeolocation = false;
        render();
        const linksCount = component.find(I18NLink).length;
        expect(linksCount).toBe(2);
        expect(component.find({ to: 'library/map?q="asd"' }).length).toBe(0);
      });
    });
  });

  describe('when tableViewMode is false', () => {
    it('should not render HideColumnsDropdown', () => {
      props = defaultProps;
      props.tableViewMode = false;
      render();
      const hideColumnsDropdownCount = component.find(HiddenColumnsDropdown).length;
      expect(hideColumnsDropdownCount).toBe(0);
    });
  });

  describe('mapStateToProps()', () => {
    beforeEach(() => {
      props = { storeKey: 'library' };
      state = {
        library: {
          search: {},
          filters: Immutable.fromJS({ properties: [] }),
          ui: Immutable.fromJS({ zoomLevel: 1, tableViewColumns: [] }),
          storeKey: 'library',
        },
        templates: Immutable.fromJS([{ properties: [{ type: 'geolocation' }] }]),
      };
    });
    it('should map the search url and check if any template has a geolocation field', () => {
      const mappedProps = mapStateToProps(state, props);
      expect(mappedProps.showGeolocation).toBe(true);
      expect(mappedProps.searchUrl).toBe('?q=()');
    });

    it('should map the zoom level', () => {
      expect(mapStateToProps(state, props).zoomLevel).toBe(1);
      expect(mapStateToProps(state, { ...props, zoomLevel: 'externallyPassed' }).zoomLevel).toBe(
        'externallyPassed'
      );
    });
  });
});
