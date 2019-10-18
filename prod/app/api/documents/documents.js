"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _fs = _interopRequireDefault(require("fs"));
var _entities = _interopRequireDefault(require("../entities"));
var _entitiesModel = _interopRequireDefault(require("../entities/entitiesModel"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var _default =

{
  save(doc, params) {
    delete doc.file;
    return _entities.default.save(doc, params);
  },

  //test (this is a temporary fix to be able to save pdfInfo from client without being logged)
  savePDFInfo(doc, params) {
    return this.getById(doc.sharedId, params.language).
    then(existingDoc => {
      if (existingDoc.pdfInfo) {
        return existingDoc;
      }
      return _entitiesModel.default.save({ _id: doc._id, sharedId: doc.sharedId, pdfInfo: doc.pdfInfo }, params);
    });
  },
  //

  get(query, select) {
    return _entities.default.get(query, select);
  },

  getById(sharedId, language) {
    return _entities.default.getById(sharedId, language);
  },

  countByTemplate(templateId) {
    return _entities.default.countByTemplate(templateId);
  },

  getHTML(id, language) {
    return this.get(id, language).
    then(docResponse => {
      const doc = docResponse.rows[0];
      const path = `${__dirname}/../../../conversions/${doc._id}.json`;
      return new Promise((resolve, reject) => {
        _fs.default.readFile(path, (err, conversionJSON) => {
          if (err) {
            reject(err);
          }

          try {
            const conversion = JSON.parse(conversionJSON);
            if (conversion.css) {
              conversion.css = conversion.css.replace(/(\..*?){/g, `._${doc._id} $1 {`);
            }
            resolve(conversion);
          } catch (e) {
            reject(e);
          }
        });
      });
    });
  },

  saveHTML(conversion) {
    conversion.type = 'conversion';
    const path = `${__dirname}/../../../conversions/${conversion.document}.json`;
    return new Promise((resolve, reject) => {
      _fs.default.writeFile(path, JSON.stringify(conversion), err => {
        if (err) {
          reject(err);
        }

        resolve(path);
      });
    });
  },

  delete(id) {
    return _entities.default.delete(id);
  } };exports.default = _default;