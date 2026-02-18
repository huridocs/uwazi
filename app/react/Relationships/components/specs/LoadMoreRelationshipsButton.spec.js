import Immutable from 'immutable';
import { renderConnected } from '#app/utils/test/renderConnected.js';
import { LoadMoreRelationshipsButton, mapStateToProps } from '../LoadMoreRelationshipsButton.jsx';
import * as connectionsListActions from '#app/ConnectionsList/actions/actions.js';

jest.mock('app/I18N', () => ({
  t: (_context, key) => key,
  Translate: ({ children }) => children,
}));

jest.mock('#app/ConnectionsList/actions/actions.js', () => ({
  ...jest.requireActual('#app/ConnectionsList/actions/actions.js'),
  loadMoreReferences: jest.fn(_limit => () => {}),
}));

describe('LoadMoreRelationshipsButton', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      totalHubs: 4,
      requestedHubs: 4,
      loadMoreAmmount: 2,
    };
    jest.clearAllMocks();
  });

  const render = () => {
    const storeData = {
      relationships: {
        list: {
          searchResults: Immutable.fromJS({
            totalHubs: props.totalHubs,
            requestedHubs: props.requestedHubs,
          }),
        },
      },
    };
    component = renderConnected(LoadMoreRelationshipsButton, props, storeData);
  };

  it('should not render a button when all hubs loaded', () => {
    render();
    expect(component.find('button').length).toBe(0);
  });

  describe('Load More button', () => {
    beforeEach(() => {
      props.requestedHubs = 3;
      render();
    });

    it('should render a button when partial loaded hubs', () => {
      expect(component.find('button').length).toBe(1);
      expect(component.find('button').text()).toBe('1 x more');
    });

    it('should call on the passed function upon click with previously requestedHubs', () => {
      const button = component.find('button');
      button.simulate('click');
      expect(connectionsListActions.loadMoreReferences).toHaveBeenCalledWith(13);
    });
  });

  describe('mapStateToProps', () => {
    it('should map the relationships list search results', () => {
      const state = {
        relationships: {
          list: {
            searchResults: Immutable.fromJS({
              totalHubs: 'totalHubs',
              requestedHubs: 'requestedHubs',
            }),
          },
        },
      };

      expect(mapStateToProps(state)).toEqual({
        totalHubs: 'totalHubs',
        requestedHubs: 'requestedHubs',
        loadMoreAmmount: 10,
      });
    });
  });
});
