"use strict";var _path = _interopRequireDefault(require("path"));
var _fs = _interopRequireDefault(require("fs"));
var _testing_db = _interopRequireDefault(require("../../utils/testing_db"));
var _entities = _interopRequireDefault(require("../../entities"));
var _settings = _interopRequireDefault(require("../../settings"));
var fileUtils = _interopRequireWildcard(require("../../utils/files"));

var _csvLoader = _interopRequireDefault(require("../csvLoader"));
var _fixtures = _interopRequireWildcard(require("./fixtures"));
var _helpers = require("./helpers");

var _paths = _interopRequireDefault(require("../../config/paths"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

const removeTestingZip = () =>
new Promise(resolve => {
  _fs.default.unlink(_path.default.join(__dirname, 'zipData/testLanguages.zip'), () => {
    resolve();
  });
});

describe('csvLoader languages', () => {
  let imported;
  const loader = new _csvLoader.default();

  beforeAll(async () => {
    await _testing_db.default.clearAllAndLoad(_fixtures.default);
    spyOn(_entities.default, 'indexEntities').and.returnValue(Promise.resolve());

    const { languages } = await _settings.default.get();
    await _settings.default.save({ languages: [...languages, { key: 'es' }] });

    await (0, _helpers.createTestingZip)([
    _path.default.join(__dirname, 'zipData/languages/import.csv'),
    _path.default.join(__dirname, '/zipData/1.pdf'),
    _path.default.join(__dirname, '/zipData/2.pdf')],
    'testLanguages.zip');
    const csv = _path.default.join(__dirname, 'zipData/testLanguages.zip');
    spyOn(fileUtils, 'generateFileName').and.callFake(
    file => `generated${file.originalname}`);

    _paths.default.uploadedDocuments = _path.default.join(__dirname, '/');
    await loader.load(csv, _fixtures.template1Id, { language: 'en' });

    imported = await _entities.default.get();
  });

  afterAll(async () => {
    await fileUtils.deleteFiles([
    _path.default.join(_paths.default.uploadedDocuments, 'generated1.pdf'),
    _path.default.join(_paths.default.uploadedDocuments, 'generated2.pdf'),
    _path.default.join(_paths.default.uploadedDocuments, `${imported[0]._id.toString()}.jpg`),
    _path.default.join(_paths.default.uploadedDocuments, `${imported[1]._id.toString()}.jpg`),
    _path.default.join(_paths.default.uploadedDocuments, `${imported[2]._id.toString()}.jpg`),
    _path.default.join(_paths.default.uploadedDocuments, `${imported[3]._id.toString()}.jpg`),
    _path.default.join(_paths.default.uploadedDocuments, `${imported[4]._id.toString()}.jpg`),
    _path.default.join(_paths.default.uploadedDocuments, `${imported[5]._id.toString()}.jpg`)]);


    await removeTestingZip();
    await _testing_db.default.disconnect();
  });

  it('should import entities in the diferent languages', async () => {
    const enTitles = imported.filter(e => e.language === 'en').map(i => i.title);
    const esTitles = imported.filter(e => e.language === 'es').map(i => i.title);
    expect(enTitles).toEqual(['title_en1', 'title_en2', 'title_en3']);
    expect(esTitles).toEqual(['title_es1', 'title_es2', 'title_es3']);
  });

  it('should import translated metadata properties', async () => {
    const enText = imported.filter(e => e.language === 'en').map(i => i.metadata.text_label);
    const esText = imported.filter(e => e.language === 'es').map(i => i.metadata.text_label);
    expect(enText).toEqual(['text_en1', 'text_en2', 'text_en3']);
    expect(esText).toEqual(['text_es1', 'text_es2', 'text_es3']);
  });

  it('should translated files', () => {
    const enText = imported.filter(e => e.language === 'en');
    const esText = imported.filter(e => e.language === 'es');
    expect(enText[0].file.filename).toBe('generated2.pdf');
    expect(esText[0].file.filename).toBe('generated1.pdf');
  });
});