"use strict";var _testing_db = _interopRequireDefault(require("../testing_db"));
var _languageMiddleware = _interopRequireDefault(require("../languageMiddleware"));
var _languageFixtures = _interopRequireDefault(require("./languageFixtures.js"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('languageMiddleware', () => {
  let req;
  const res = {};
  let next;
  beforeEach(async () => {
    await _testing_db.default.clearAllAndLoad(_languageFixtures.default);
    req = {
      get: headerName => ({ 'content-language': 'es', 'accept-language': 'en-US' })[headerName] };

    next = jasmine.createSpy('next');
  });

  afterAll(async () => {
    await _testing_db.default.disconnect();
  });

  describe('when language exists on the config', () => {
    it('should set req.language with content-language', async () => {
      await (0, _languageMiddleware.default)(req, res, next);

      expect(req.language).toBe('es');
      expect(next).toHaveBeenCalled();
    });

    describe('when no content-language', () => {
      it('should use cookies.locale', async () => {
        req = {
          get: () => {},
          cookies: {
            locale: 'en' } };


        await (0, _languageMiddleware.default)(req, res, next);
        expect(req.language).toBe('en');
        expect(next).toHaveBeenCalled();
      });
    });

    describe('when no content-language and no cookie', () => {
      it('should use accept-language', async () => {
        req = {
          get: headerName => ({ 'accept-language': 'en-US' })[headerName] };

        await (0, _languageMiddleware.default)(req, res, next);
        expect(req.language).toBe('en');
        expect(next).toHaveBeenCalled();
      });
    });
  });

  describe('when language do not exist on the config', () => {
    it('should set the default one "es"', async () => {
      req = {
        get: headerName => ({ 'content-language': 'nonExistent' })[headerName] };


      await (0, _languageMiddleware.default)(req, res, next);
      expect(req.language).toBe('es');
      expect(next).toHaveBeenCalled();
    });
  });
});