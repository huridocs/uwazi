import Immutable from 'immutable';
import { renderConnected } from '#app/utils/test/renderConnected.js';
import { ResultsFiltersPanel } from '../ResultsFiltersPanel.jsx';

describe('ResultsFiltersPanel', () => {
  let props;
  let component;
  const storeData = {
    semanticSearch: {
      selectedDocument: Immutable.fromJS({}),
      resultsFilters: { threshold: 0.8 },
    },
  };
  beforeEach(() => {
    props = {
      open: true,
      filtersValues: { threshold: 0.8 },
    };

    component = renderConnected(ResultsFiltersPanel, props, storeData);
  });

  describe('render', () => {
    it('should render search filters and instructions', () => {
      expect(component).toMatchSnapshot();
    });
  });
});
