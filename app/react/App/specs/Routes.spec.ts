/**
 * @jest-environment jsdom
 */
import { fromJS } from 'immutable';
import { getIndexRoute } from 'app/Routes';
import * as googleAnalytics from 'app/App/GoogleAnalytics';
import { IImmutable } from 'shared/types/Immutable';
import store from 'app/store';
import { IStore } from 'app/istore';

const defaultUser: {} = { _id: 'user1' };
let currentPath = 'library';
let currentUser = defaultUser;
let currentThesauris: IImmutable<[]> = fromJS([]);

const getState = (): Partial<IStore> => ({
  user: fromJS(currentUser),
  settings: { collection: fromJS({ home_page: currentPath, defaultLibraryView: 'table' }) },
  thesauris: currentThesauris,
});

describe('Routes', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });
  describe('getIndexRoute', () => {
    it('should replace the route to the library when there is a user', async () => {
      currentPath = 'library/en';
      jest.spyOn(store(), 'getState').mockReturnValue(getState() as IStore);
      const callBack = jest.fn().mockImplementation((_nextState, props) => props);
      jest.spyOn(googleAnalytics, 'trackPage').mockImplementation(jest.fn());
      const replaceMock = jest.fn();
      const res = getIndexRoute('nextState', callBack);
      res.onEnter('nextState', replaceMock);
      expect(replaceMock).toHaveBeenCalledWith('/library/?q=(includeUnpublished:!t)');
      expect(googleAnalytics.trackPage).not.toHaveBeenCalled();
    });

    it('should replace the route to login if there is not a user', async () => {
      currentUser = {};
      currentPath = 'library/en';
      jest.spyOn(store(), 'getState').mockReturnValue(getState() as IStore);
      const callBack = jest.fn().mockImplementation((_nextState, props) => props);
      jest.spyOn(googleAnalytics, 'trackPage').mockImplementation(jest.fn());
      const replaceMock = jest.fn();
      const res = getIndexRoute('nextState', callBack);
      res.onEnter('nextState', replaceMock);
      expect(replaceMock).toHaveBeenCalledWith('/login');
      expect(googleAnalytics.trackPage).not.toHaveBeenCalled();
    });

    it('should replace the route to the default library if there is not user and it is not a blank state', async () => {
      currentUser = {};
      currentPath = 'library/en';
      currentThesauris = fromJS([{ values: ['a', 'b'] }]);
      jest.spyOn(store(), 'getState').mockReturnValue(getState() as IStore);
      const callBack = jest.fn().mockImplementation((_nextState, props) => props);
      jest.spyOn(googleAnalytics, 'trackPage').mockImplementation(jest.fn());
      const replaceMock = jest.fn();
      const res = getIndexRoute('nextState', callBack);
      res.onEnter('nextState', replaceMock);
      expect(googleAnalytics.trackPage).toHaveBeenCalled();
    });

    it('should track page when home page is a valid public page path', async () => {
      currentPath = 'en/page/8kjynp9c9nk/page-1';
      jest.spyOn(store(), 'getState').mockReturnValue(getState() as IStore);
      const callBack = jest.fn().mockImplementation((_nextState, props) => props);
      jest.spyOn(googleAnalytics, 'trackPage').mockImplementation(jest.fn());

      const res = getIndexRoute('nextState', callBack);
      expect(res.customHomePageId).toEqual('8kjynp9c9nk');
      expect(googleAnalytics.trackPage).toHaveBeenCalled();
    });

    it('should track page when home page is a valid public entity path', async () => {
      currentPath = 'en/entity/7bjhkli';
      jest.spyOn(store(), 'getState').mockReturnValue(getState() as IStore);
      const callBack = jest.fn().mockImplementation((_nextState, props) => props);
      jest.spyOn(googleAnalytics, 'trackPage').mockImplementation(jest.fn());
      const replaceMock = jest.fn();
      const res = getIndexRoute('nextState', callBack);
      res.onEnter('nextState', replaceMock);
      expect(googleAnalytics.trackPage).not.toHaveBeenCalled();
    });
  });
});
