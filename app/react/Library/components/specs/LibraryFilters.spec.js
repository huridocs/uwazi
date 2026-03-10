import React from 'react';
import { shallow } from 'enzyme';
import Immutable from 'immutable';

import { LibraryFilters, mapStateToProps } from 'app/Library/components/LibraryFilters';
import SidePanel from 'app/Layout/SidePanel';

describe('LibraryFilters', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      open: true,
      resetFilters: _storeKey => {},
      toggleIncludeUnpublished: _storeKey => {},
      hideFilters: () => {},
    };
  });

  const render = () => {
    component = shallow(<LibraryFilters {...props} />);
  };

  it('shoud have library-filters class', () => {
    render();
    expect(component.find(SidePanel).hasClass('library-filters')).toBe(true);
  });

  describe('maped state', () => {
    it('should contain the filters store and the filters form', () => {
      const store = {
        library: {
          filters: Immutable.fromJS({ properties: 'filters state', documentTypes: ['Decision'] }),
          ui: Immutable.fromJS({
            searchTerm: 'Zerg Rush',
            filtersPanel: true,
            selectedDocuments: [],
          }),
          aggregations: Immutable.fromJS({ types: { buckets: [] } }),
          settings: Immutable.fromJS({ collection: { filters: [] } }),
        },
        templates: Immutable.fromJS([]),
      };

      const state = mapStateToProps(store, { storeKey: 'library' });

      expect(state).toEqual({ open: true });
    });
  });

  describe('closing button', () => {
    it('should show button if sidePanelMode is unpinned-mode', () => {
      props.sidePanelMode = 'unpinned-mode';
      render();
      const closeButton = component.find({ onClick: props.hideFilters });
      expect(closeButton.find('.only-mobile').length).toBe(0);
    });
    it('should have only-mobile class if sidePanelMode is not unpinned-mode', () => {
      props.sidePanelMode = '';
      render();
      const closeButton = component.find({ onClick: props.hideFilters });
      expect(closeButton.find('.only-mobile').length).toBe(1);
    });
  });
});
