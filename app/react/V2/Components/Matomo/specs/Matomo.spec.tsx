import Immutable from 'immutable';
import { I18NLink } from 'app/I18N';
import { renderConnected } from 'app/utils/test/renderConnected';
import { Menu } from 'app/App/Menu';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: () => ({
    search: '?q=(searchTerm:%27asd%27)',
  }),
  useParams: () => ({
    errorCode: 500,
  }),
}));

describe('Menu', () => {
  let component;
  let defaultLibraryView;
  let user;
  let isPrivate;

  beforeEach(() => {
    defaultLibraryView = 'cards';
    user = Immutable.fromJS({});
    isPrivate = false;
  });

  const render = () => {
    const storeState = {
      user,
      settings: {
        collection: Immutable.fromJS({
          links: Immutable.fromJS([
            { _id: 1, url: 'internal_url', title: 'Internal url' },
            { _id: 2, url: 'http://external_url', title: 'External url' },
            { _id: 3, url: undefined, title: 'undefined url' },
            { _id: 4, url: '/', title: 'single slash url' },
          ]),
          defaultLibraryView,
          private: isPrivate,
        }),
      },
      libraryFilters: Immutable.fromJS({
        properties: [],
      }),
      location: { query: { searchTerm: 'asd' } },
      library: {
        search: {
          sort: 'asc',
        },
        filters: Immutable.fromJS({
          properties: [],
        }),
      },
    };
    component = renderConnected(Menu, {}, storeState);
  };

  describe('Links', () => {
    it('Renders external and internal links', () => {
      render();

      const internalLink = component.find('.menuNav-list').first().find(I18NLink);
      expect(internalLink.length).toBe(3);
      expect(internalLink.at(0).props().to).toBe('internal_url');
      expect(internalLink.at(1).props().to).toBe('/');
      expect(internalLink.at(2).props().to).toBe('/');

      const externalLink = component.find('.menuNav-list').first().find('a');
      expect(externalLink.length).toBe(1);
      expect(externalLink.props().href).toBe('http://external_url');
      expect(externalLink.props().target).toBe('_blank');
    });
  });

  describe('Default library view', () => {
    it('should navigate to the cards view if no default view selected', () => {
      render();

      const libraryButton = component.find({ to: "/library/?q=(searchTerm:'asd',sort:asc)" });
      expect(libraryButton.length).toBe(1);
    });

    it('should navigate to the selected default view', () => {
      defaultLibraryView = 'table';
      render();

      const libraryButton = component.find({
        to: "/library/table/?q=(searchTerm:'asd',sort:asc)",
      });
      expect(libraryButton.length).toBe(1);
    });
  });

  describe('private instance', () => {
    it('it should not display the library button for not logged in users', () => {
      isPrivate = true;
      render();
      const menuButtons = component.find('.tab-link-label');
      expect(menuButtons.map(node => node.children().children().text())).not.toContain('Library');
    });

    it('should display the library button for logged in users', () => {
      isPrivate = true;
      user = Immutable.fromJS({ _id: 'user1' });
      render();
      const menuButtons = component.find('.tab-link-label');
      expect(menuButtons.map(node => node.children().children().text())).toContain('Library');
    });
  });
});
