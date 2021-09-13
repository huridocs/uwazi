import Immutable from 'immutable';
import Footer from 'app/App/Footer';
import { renderConnected } from 'app/utils/test/renderConnected';

describe('Footer', () => {
  describe('Default library view', () => {
    it('should point the Library link to the correct view', () => {
      const storeState = {
        user: Immutable.fromJS({ _id: 'userid' }),
        settings: {
          collection: Immutable.fromJS({
            site_name: 'site_name',
            defaultLibraryView: 'table',
          }),
        },
      };
      const component = renderConnected(Footer, {}, storeState);

      expect(component.find({ to: '/library/table' }).length).toBe(1);
    });
  });
});
