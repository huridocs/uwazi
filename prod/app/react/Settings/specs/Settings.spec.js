"use strict";var _UsersAPI = _interopRequireDefault(require("../../Users/UsersAPI"));
var _ThesaurisAPI = _interopRequireDefault(require("../../Thesauris/ThesaurisAPI"));
var _RelationTypesAPI = _interopRequireDefault(require("../../RelationTypes/RelationTypesAPI"));
var _I18N = require("../../I18N");
var _RequestParams = require("../../utils/RequestParams");
var _SettingsAPI = _interopRequireDefault(require("../SettingsAPI"));
var _Settings = require("../Settings");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('Settings', () => {
  describe('requestState', () => {
    const user = { name: 'doe' };
    const dictionaries = [{ _id: 1, name: 'Countries' }];
    const relationTypes = [{ _id: 1, name: 'Supports' }];
    const translations = [{ _id: 1, locale: 'es', values: {} }];
    const settings = { siteName: 'BatCave' };

    beforeEach(() => {
      spyOn(_UsersAPI.default, 'currentUser').and.returnValue(Promise.resolve(user));
      spyOn(_ThesaurisAPI.default, 'getDictionaries').and.returnValue(Promise.resolve(dictionaries));
      spyOn(_RelationTypesAPI.default, 'get').and.returnValue(Promise.resolve(relationTypes));
      spyOn(_I18N.I18NApi, 'get').and.returnValue(Promise.resolve(translations));
      spyOn(_SettingsAPI.default, 'get').and.returnValue(Promise.resolve(settings));
    });

    it('should get the current user, and metadata', async () => {
      const actions = await _Settings.Settings.requestState(new _RequestParams.RequestParams());
      expect(actions).toMatchSnapshot();
    });
  });
});