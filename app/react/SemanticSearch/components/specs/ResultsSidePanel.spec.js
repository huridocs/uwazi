import { renderConnected } from '#app/utils/test/renderConnected.js';
import { ResultsSidePanel } from '../ResultsSidePanel.jsx';

describe('DocumentResults', () => {
  let component;
  beforeEach(() => {
    component = renderConnected(ResultsSidePanel, {}, {});
  });

  describe('render', () => {
    it('should render results filters panel and document side panel', () => {
      expect(component).toMatchSnapshot();
    });
  });
});
