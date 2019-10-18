"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _utils = require("../utils");
var _uniqueID = _interopRequireDefault(require("../../shared/uniqueID"));
var _date = _interopRequireDefault(require("../utils/date.js"));

var _pagesModel = _interopRequireDefault(require("./pagesModel"));
var _settings = _interopRequireDefault(require("../settings"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var _default =

{
  save(doc, user, language) {
    if (!doc.sharedId) {
      doc.user = user._id;
      doc.creationDate = _date.default.currentUTC();
    }

    if (doc.sharedId) {
      return _pagesModel.default.save(doc);
    }

    return _settings.default.get().then(({ languages }) => {
      const sharedId = (0, _uniqueID.default)();
      const docs = languages.map(lang => {
        const langDoc = Object.assign({}, doc);
        langDoc.language = lang.key;
        langDoc.sharedId = sharedId;
        return langDoc;
      });

      return _pagesModel.default.save(docs).
      then(() => this.getById(sharedId, language));
    });
  },

  get(query, select) {
    return _pagesModel.default.get(query, select);
  },

  getById(sharedId, language, select) {
    return this.get({ sharedId, language }, select).
    then(results => results[0] ? results[0] : Promise.reject((0, _utils.createError)('Page not found', 404)));
  },

  delete(sharedId) {
    return _pagesModel.default.delete({ sharedId });
  },

  async addLanguage(language) {
    const [lanuageTranslationAlreadyExists] = await this.get({ locale: language }, null, { limit: 1 });
    if (lanuageTranslationAlreadyExists) {
      return Promise.resolve();
    }

    const { languages } = await _settings.default.get();

    const defaultLanguage = languages.find(l => l.default).key;
    const duplicate = (offset, totalRows) => {
      const limit = 200;
      if (offset >= totalRows) {
        return Promise.resolve();
      }

      return this.get({ language: defaultLanguage }, null, { skip: offset, limit }).
      then(pages => {
        const savePages = pages.map(_page => {
          const page = Object.assign({}, _page);
          delete page._id;
          delete page.__v;
          page.language = language;
          return this.save(page);
        });

        return Promise.all(savePages);
      }).
      then(() => duplicate(offset + limit, totalRows));
    };

    return this.count({ language: defaultLanguage }).
    then(totalRows => duplicate(0, totalRows));
  },

  async removeLanguage(language) {
    return _pagesModel.default.delete({ language });
  },

  count: _pagesModel.default.count };exports.default = _default;