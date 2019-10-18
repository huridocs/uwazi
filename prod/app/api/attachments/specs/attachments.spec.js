"use strict";var _testing_db = _interopRequireDefault(require("../../utils/testing_db"));
var _path = _interopRequireDefault(require("path"));
var _relationships = _interopRequireDefault(require("../../relationships"));
var _asyncFs = _interopRequireDefault(require("../../utils/async-fs"));

var _entities = _interopRequireDefault(require("../../entities"));
var _fixtures = _interopRequireWildcard(require("./fixtures"));
var _paths = _interopRequireDefault(require("../../config/paths"));
var _attachments = _interopRequireDefault(require("../attachments"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('attachments', () => {
  let originalAttachmentsPath;

  beforeEach(async () => {
    spyOn(_entities.default, 'indexEntities').and.returnValue(Promise.resolve());
    originalAttachmentsPath = _paths.default.attachments;

    await _testing_db.default.clearAllAndLoad(_fixtures.default);
  });

  afterEach(() => {
    _paths.default.attachments = originalAttachmentsPath;
  });

  afterAll(async () => _testing_db.default.disconnect());

  describe('/delete', () => {
    beforeEach(async () => {
      await _asyncFs.default.writeFile(_path.default.join(_paths.default.attachments, 'attachment.txt'), 'dummy file');
      await _asyncFs.default.writeFile(_path.default.join(_paths.default.attachments, 'mainFile.txt'), 'dummy file');
      await _asyncFs.default.writeFile(_path.default.join(_paths.default.attachments, `${_fixtures.toDeleteId.toString()}.jpg`), 'dummy file');
      await _asyncFs.default.writeFile(_path.default.join(_paths.default.attachments, `${_fixtures.entityId.toString()}.jpg`), 'dummy file');
      await _asyncFs.default.writeFile(_path.default.join(_paths.default.attachments, `${_fixtures.entityIdEn.toString()}.jpg`), 'dummy file');
      spyOn(_relationships.default, 'deleteTextReferences').and.returnValue(Promise.resolve());
    });

    it('should remove main file and thumbnail if id matches entity', async () => {
      expect((await _asyncFs.default.exists(`${_paths.default.attachments}attachment.txt`))).toBe(true);

      const response = await _attachments.default.delete(_fixtures.toDeleteId);
      const dbEntity = await _entities.default.getById(_fixtures.toDeleteId);
      expect(response._id.toString()).toBe(_fixtures.toDeleteId.toString());
      expect(response.attachments.length).toBe(2);
      expect(dbEntity.attachments.length).toBe(2);
      expect(response.file).toBe(null);
      expect(dbEntity.file).toBe(null);
      expect((await _asyncFs.default.exists(_path.default.join(_paths.default.attachments, 'mainFile.txt')))).toBe(false);
      expect((await _asyncFs.default.exists(_path.default.join(_paths.default.attachments, `${_fixtures.toDeleteId.toString()}.jpg`)))).toBe(false);
    });

    it('should remove main file on sibling entities', async () => {
      expect((await _asyncFs.default.exists(`${_paths.default.attachments}attachment.txt`))).toBe(true);
      const response = await _attachments.default.delete(_fixtures.entityId);

      expect(response._id.toString()).toBe(_fixtures.entityId.toString());
      expect(response.file).toBe(null);
      expect(response.toc).toBe(null);

      const changedEntities = await _entities.default.get({ sharedId: _fixtures.sharedId });
      await Promise.all(changedEntities.map(async e => {
        expect(e.file).toBe(null);
        expect(e.file).toBe(null);
        expect(_relationships.default.deleteTextReferences).toHaveBeenCalledWith(_fixtures.sharedId, e.language);
        expect((await _asyncFs.default.exists(_path.default.join(_paths.default.attachments, `${e._id.toString()}.jpg`)))).toBe(false);
      }));
    });

    it('should remove the passed file from attachments and delte the local file', async () => {
      expect((await _asyncFs.default.exists(`${_paths.default.attachments}attachment.txt`))).toBe(true);
      const response = await _attachments.default.delete(_fixtures.attachmentToDelete);
      const dbEntity = await _entities.default.getById(_fixtures.toDeleteId);

      expect(response._id.toString()).toBe(_fixtures.toDeleteId.toString());
      expect(response.attachments.length).toBe(1);
      expect(dbEntity.attachments.length).toBe(1);
      expect(dbEntity.attachments[0].filename).toBe('other.doc');
      expect((await _asyncFs.default.exists(_path.default.join(_paths.default.attachments, 'attachment.txt')))).toBe(false);
    });

    it('should not delte the local file if other siblings are using it', async () => {
      expect((await _asyncFs.default.exists(`${_paths.default.attachments}attachment.txt`))).toBe(true);
      const sibling = {
        title: 'title',
        sharedId: _fixtures.toDeleteId.toString(),
        attachments: [{
          filename: 'attachment.txt',
          originalname: 'common name 1.not' }] };


      await _entities.default.saveMultiple([sibling]);
      const response = await _attachments.default.delete(_fixtures.attachmentToDelete);
      const dbEntity = await _entities.default.getById(_fixtures.toDeleteId);

      expect(response._id.toString()).toBe(_fixtures.toDeleteId.toString());
      expect(dbEntity.attachments.length).toBe(1);
      expect((await _asyncFs.default.exists(`${_paths.default.attachments}attachment.txt`))).toBe(true);
    });

    it('should not fail if, for some reason, file doesnt exist', async () => {
      expect((await _asyncFs.default.exists(`${_paths.default.attachments}attachment.txt`))).toBe(true);
      await _asyncFs.default.unlink(`${_paths.default.attachments}attachment.txt`);
      await _attachments.default.delete(_fixtures.attachmentToDelete);
    });
  });
});