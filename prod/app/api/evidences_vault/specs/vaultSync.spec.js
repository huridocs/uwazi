"use strict";var _path = _interopRequireDefault(require("path"));
var _moment = _interopRequireDefault(require("moment"));
var _testing_db = _interopRequireDefault(require("../../utils/testing_db"));
var _entities = _interopRequireDefault(require("../../entities"));
var _files = require("../../utils/files");
var _asyncFs = _interopRequireDefault(require("../../utils/async-fs"));

var _fixtures = _interopRequireWildcard(require("./fixtures"));
var _helpers = require("./helpers.js");
var _vaultSync = _interopRequireDefault(require("../vaultSync"));
var _vaultEvidencesModel = _interopRequireDefault(require("../vaultEvidencesModel"));
var _paths = _interopRequireDefault(require("../../config/paths"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('vaultSync', () => {
  const token = 'auth_token';

  beforeEach(async () => {
    await _testing_db.default.clearAllAndLoad(_fixtures.default);
    _paths.default.uploadedDocuments = _path.default.join(__dirname, 'uploads');
    spyOn(_entities.default, 'indexEntities').and.returnValue(Promise.resolve());
  });

  afterEach(async () => {
    await (0, _files.deleteFile)(_path.default.join(__dirname, '/zips/package1.zip'));
    await (0, _files.deleteFile)(_path.default.join(__dirname, '/zips/package2.zip'));
    await (0, _files.deleteFile)(_path.default.join(__dirname, '/zips/package3.zip'));
    const files = (await _asyncFs.default.readdir(_paths.default.uploadedDocuments)).
    filter(f => f !== 'index.html').map(f => _path.default.join(_paths.default.uploadedDocuments, f));

    await (0, _files.deleteFiles)(files);
  });

  afterAll(async () => {
    await _testing_db.default.disconnect();
  });

  describe('sync', () => {
    beforeEach(async () => {
      const evidences = [
      {
        listItem: {
          request: '1',
          filename: 'package1.zip',
          url: 'url 1',
          status: '201',
          time_of_request: '2019-05-30 09:31:25' },

        jsonInfo: { title: 'title1' } },

      {
        listItem: {
          request: '2',
          filename: 'package2.zip',
          url: 'url 2',
          status: '201',
          time_of_request: '2018-05-25 09:31:25' },

        jsonInfo: { title: 'title2' } }];



      await (0, _helpers.mockVault)(evidences);
      await _vaultSync.default.sync(token, _fixtures.templateId);
    });

    it('should create entities based on evidences returned', async () => {
      const imported = await _entities.default.get();

      expect(imported.map(e => e.title)).toEqual(['title1', 'title2']);
      expect(imported.map(e => e.template)).toEqual([_fixtures.templateId, _fixtures.templateId]);
    });

    it('should assign url to link field', async () => {
      const imported = await _entities.default.get();

      expect(imported.map(e => e.metadata.original_url)).toEqual([
      { label: 'url 1', url: 'url 1' },
      { label: 'url 2', url: 'url 2' }]);

    });

    it('should assign time of request', async () => {
      const imported = await _entities.default.get();

      const dates = imported.map(e => _moment.default.utc(e.metadata.time_of_request, 'X').format('DD-MM-YYYY'));
      expect(dates).toEqual(['30-05-2019', '25-05-2018']);
    });

    it('should add zip package as attachment', async () => {
      const imported = await _entities.default.get();

      expect((await (0, _files.getFileContent)('1.png'))).toBe('this is a fake image');
      expect((await (0, _files.getFileContent)('2.png'))).toBe('this is a fake image');

      expect(imported[0].attachments.find(a => a.filename.match(/zip/))).toEqual(
      expect.objectContaining({
        filename: '1.zip' }));



      expect(imported[1].attachments.find(a => a.filename.match(/zip/))).toEqual(
      expect.objectContaining({
        filename: '2.zip' }));


    });

    it('should set png file as an attachment, and add the link into image field', async () => {
      const imported = await _entities.default.get();

      expect((await (0, _files.getFileContent)('1.png'))).toBe('this is a fake image');
      expect((await (0, _files.getFileContent)('2.png'))).toBe('this is a fake image');

      expect(imported.map(e => e.metadata.screenshot)).toEqual([
      `/api/attachments/download?_id=${imported[0]._id}&file=1.png`,
      `/api/attachments/download?_id=${imported[1]._id}&file=2.png`]);


      expect(imported[0].attachments.find(a => a.filename.match(/png/))).toEqual(
      expect.objectContaining({
        filename: '1.png' }));



      expect(imported[1].attachments.find(a => a.filename.match(/png/))).toEqual(
      expect.objectContaining({
        filename: '2.png' }));


    });

    it('should set mp4 file as an attachment, and add the link into media field', async () => {
      const imported = await _entities.default.get();

      expect((await (0, _files.getFileContent)('1.mp4'))).toBe('this is a fake video');
      expect((await (0, _files.getFileContent)('2.mp4'))).toBe('this is a fake video');

      expect(imported.map(e => e.metadata.video)).toEqual([
      `/api/attachments/download?_id=${imported[0]._id}&file=1.mp4`,
      `/api/attachments/download?_id=${imported[1]._id}&file=2.mp4`]);


      expect(imported[0].attachments.find(a => a.filename.match(/mp4/))).toEqual(
      expect.objectContaining({
        filename: '1.mp4' }));



      expect(imported[1].attachments.find(a => a.filename.match(/mp4/))).toEqual(
      expect.objectContaining({
        filename: '2.mp4' }));


    });
  });

  it('should not fill media/image field if file does not exist', async () => {
    const evidences = [
    {
      listItem: {
        request: '1',
        filename: 'package1.zip',
        status: '201' },

      jsonInfo: { title: 'title1' } },

    {
      listItem: { request: '2', filename: 'package2.zip', status: '201' } }];



    await (0, _helpers.mockVault)(evidences);
    await _vaultSync.default.sync(token, _fixtures.templateId);
    const imported = await _entities.default.get();

    expect((await (0, _files.getFileContent)('1.mp4'))).toBe('this is a fake video');

    expect(imported.map(e => e.metadata.video)).toEqual([
    `/api/attachments/download?_id=${imported[0]._id}&file=1.mp4`,
    '']);


    expect(imported.map(e => e.metadata.screenshot)).toEqual([
    `/api/attachments/download?_id=${imported[0]._id}&file=1.png`,
    '']);


    expect(imported[0].attachments).toEqual([
    expect.objectContaining({
      filename: '1.mp4' }),

    expect.objectContaining({
      filename: '1.png' }),

    expect.objectContaining({
      filename: '1.zip' })]);



    expect(imported[1].attachments).toEqual([
    expect.objectContaining({
      filename: '2.zip' })]);


  });

  it('should not import already imported evidences', async () => {
    await _vaultEvidencesModel.default.save([{ request: '1' }, { request: '3' }]);
    const evidences = [
    { listItem: { request: '1', filename: 'package1.zip' }, jsonInfo: { title: 'title1' } },
    { listItem: { request: '3', filename: 'package3.zip' }, jsonInfo: { title: 'title3' } },
    {
      listItem: {
        request: '2',
        filename: 'package2.zip',
        url: 'url 2',
        status: '201',
        time_of_request: '2019-05-30 09:31:25' },

      jsonInfo: {
        title: 'title2' } }];




    await (0, _helpers.mockVault)(evidences);
    await _vaultSync.default.sync(token, _fixtures.templateId);
    await _vaultSync.default.sync(token, _fixtures.templateId);

    const imported = await _entities.default.get();
    expect(imported.map(e => e.title)).toEqual(['title2']);
  });

  it('should not import evidences with 202, 203 or 501 status', async () => {
    const evidences = [
    { listItem: { status: '201', request: '1', filename: 'package1.zip' }, jsonInfo: { title: 'title1' } },
    { listItem: { status: '203', request: '2', filename: 'package2.zip' }, jsonInfo: { title: 'title2' } },
    { listItem: { status: '202', request: '3', filename: 'package3.zip' }, jsonInfo: { title: 'title3' } },
    { listItem: { status: '501', request: '4', filename: null }, jsonInfo: { title: 'title4' } }];


    await (0, _helpers.mockVault)(evidences);
    await _vaultSync.default.sync(token, _fixtures.templateId);

    const imported = await _entities.default.get();
    expect(imported.map(e => e.title)).toEqual(['title1']);
  });
});