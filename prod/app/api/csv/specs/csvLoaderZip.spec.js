"use strict";var _testing_db = _interopRequireDefault(require("../../utils/testing_db"));
var _entities = _interopRequireDefault(require("../../entities"));
var _path = _interopRequireDefault(require("path"));
var _fs = _interopRequireDefault(require("fs"));
var fileUtils = _interopRequireWildcard(require("../../utils/files"));

var _csvLoader = _interopRequireDefault(require("../csvLoader"));
var _fixtures = _interopRequireWildcard(require("./fixtures"));

var _paths = _interopRequireDefault(require("../../config/paths"));
var _helpers = require("./helpers");function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

const removeTestingZip = () =>
new Promise(resolve => {
  _fs.default.unlink(_path.default.join(__dirname, '/zipData/test.zip'), () => {
    resolve();
  });
});

describe('csvLoader zip file', () => {
  let imported;
  afterAll(async () => _testing_db.default.disconnect());
  beforeAll(async () => {
    const zip = _path.default.join(__dirname, '/zipData/test.zip');
    const loader = new _csvLoader.default();
    await _testing_db.default.clearAllAndLoad(_fixtures.default);
    await (0, _helpers.createTestingZip)([
    _path.default.join(__dirname, '/zipData/test.csv'),
    _path.default.join(__dirname, '/zipData/import.csv'),
    _path.default.join(__dirname, '/zipData/1.pdf'),
    _path.default.join(__dirname, '/zipData/2.pdf'),
    _path.default.join(__dirname, '/zipData/3.pdf')],
    'test.zip');
    spyOn(_entities.default, 'indexEntities').and.returnValue(Promise.resolve());
    spyOn(fileUtils, 'generateFileName').and.callFake(
    file => `generated${file.originalname}`);

    _paths.default.uploadedDocuments = _path.default.join(__dirname, '/zipData/');
    await loader.load(zip, _fixtures.template1Id);
    imported = await _entities.default.get({}, '+fullText');
  });

  afterAll(async () => {
    await fileUtils.deleteFiles([
    _path.default.join(_paths.default.uploadedDocuments, 'generated1.pdf'),
    _path.default.join(_paths.default.uploadedDocuments, 'generated2.pdf'),
    _path.default.join(_paths.default.uploadedDocuments, 'generated3.pdf'),
    _path.default.join(_paths.default.uploadedDocuments, `${imported[0]._id}.jpg`),
    _path.default.join(_paths.default.uploadedDocuments, `${imported[1]._id}.jpg`),
    _path.default.join(_paths.default.uploadedDocuments, `${imported[2]._id}.jpg`)]);

    await removeTestingZip();
  });

  it('should save files into uploaded_documents', async () => {
    expect((await (0, _helpers.fileExists)('generated1.pdf'))).toBe(true);
    expect((await (0, _helpers.fileExists)('generated2.pdf'))).toBe(true);
    expect((await (0, _helpers.fileExists)('generated3.pdf'))).toBe(true);
  });

  it('should create thumbnails of the pdf files', async () => {
    expect((await (0, _helpers.fileExists)(`${imported[0]._id}.jpg`))).toBe(true);
    expect((await (0, _helpers.fileExists)(`${imported[1]._id}.jpg`))).toBe(true);
    expect((await (0, _helpers.fileExists)(`${imported[2]._id}.jpg`))).toBe(true);
  });

  it('should import the file asociated with each entity', async () => {
    expect(imported.length).toBe(3);

    expect(imported[0]).toEqual(expect.objectContaining(
    {
      uploaded: true,
      processed: true,
      fullText: { 1: '1[[1]]\n\n' },
      file: expect.objectContaining({
        filename: 'generated1.pdf',
        originalname: '1.pdf' }) }));



    expect(imported[1]).toEqual(expect.objectContaining(
    {
      uploaded: true,
      processed: true,
      fullText: { 1: '2[[1]]\n\n' },
      file: expect.objectContaining({
        filename: 'generated2.pdf',
        originalname: '2.pdf' }) }));



  });
});