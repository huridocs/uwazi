"use strict";require("../../utils/jasmineHelpers");
var _testing_db = _interopRequireDefault(require("../../utils/testing_db"));
var _relationships = _interopRequireDefault(require("../../relationships"));

var _routes = _interopRequireDefault(require("../routes"));
var _entities = _interopRequireDefault(require("../../entities"));
var _fixtures = _interopRequireWildcard(require("./fixtures"));
var _instrumentRoutes = _interopRequireDefault(require("../../utils/instrumentRoutes"));
var _paths = _interopRequireDefault(require("../../config/paths"));
var _attachments = _interopRequireDefault(require("../attachments"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('Attachments Routes', () => {
  let routes;
  let originalAttachmentsPath;

  const testRouteResponse = async (URL, req, expected) => {
    const response = await routes.get(URL, req);
    expect(response).toBe(expected);
  };

  beforeEach(async () => {
    spyOn(_entities.default, 'indexEntities').and.returnValue(Promise.resolve());
    originalAttachmentsPath = _paths.default.attachments;
    routes = (0, _instrumentRoutes.default)(_routes.default);

    await _testing_db.default.clearAllAndLoad(_fixtures.default);
  });

  afterEach(() => {
    _paths.default.attachments = originalAttachmentsPath;
  });

  afterAll(async () => _testing_db.default.disconnect());

  describe('/attachment/file', () => {
    it('should send the requested existing file', async () => {
      _paths.default.attachments = `${__dirname}/uploads/`;
      const expected = `sendFile:${_paths.default.attachments}mockfile.doc`;
      await testRouteResponse('/api/attachment/:file', { params: { file: 'mockfile.doc' } }, expected);
    });

    it('should redirect to no_preview if file doesnt exist', async () => {
      await testRouteResponse('/api/attachment/:file', { params: { file: 'missing.jpg' } }, 'redirect:/public/no-preview.png');
    });
  });

  describe('/download', () => {
    const expect404Error = async (req, res) => {
      let error;
      try {
        await routes.get('/api/attachments/download', req, res);
      } catch (e) {
        error = e;
      }
      expect(error.code).toBe(404);
    };

    it('should have a validation schema', () => {
      expect(routes.get.validation('/api/attachments/download')).toMatchSnapshot();
    });

    it('should download the document with the title as file name (replacing extension with file ext)', async () => {
      const req = { query: { _id: _fixtures.entityId, file: 'match.doc' } };
      const res = {};
      _paths.default.attachments = `${__dirname}/uploads`;

      await routes.get('/api/attachments/download', req, res);
      expect(res.download).toHaveBeenCalledWith(`${__dirname}/uploads/${req.query.file}`, 'common name 2.doc');
      _paths.default.attachments = `${__dirname}/uploads/`;
      await routes.get('/api/attachments/download', req, res);
      expect(res.download).toHaveBeenCalledWith(`${__dirname}/uploads/${req.query.file}`, 'common name 2.doc');
    });

    it('should fail when entity does not exists', async () => {
      const nonExistentId = _testing_db.default.id();
      const req = { query: { _id: nonExistentId, file: 'match.doc' } };
      const res = {};
      _paths.default.attachments = `${__dirname}/uploads`;

      await expect404Error(req, res);
    });

    it('should fail when attachment does not exist', async () => {
      const req = { query: { _id: _fixtures.entityId, file: 'nonExisting.doc' } };
      const res = {};
      _paths.default.attachments = `${__dirname}/uploads`;

      await expect404Error(req, res);
    });
  });

  describe('/upload', () => {
    let req;
    let file;

    beforeEach(() => {
      file = {
        originalname: 'new original name.miss',
        filename: 'mockfile.doc' };

      req = { user: 'admin', headers: {}, body: { entityId: _fixtures.entityId }, files: [file] };
    });

    it('should need authorization', () => {
      expect(routes._post('/api/attachments/upload', req)).toNeedAuthorization();
    });

    it('should have a validation schema', () => {
      expect(routes.post.validation('/api/attachments/upload')).toMatchSnapshot();
    });

    it('should add the uploaded file to attachments, add current timestamp and return the attachment, including its new ID', async () => {
      spyOn(Date, 'now').and.returnValue(1000);
      const addedFile = await routes.post('/api/attachments/upload', req);
      const dbEntity = await _entities.default.getById(req.body.entityId);

      expect(dbEntity.attachments[2].filename).toEqual(file.filename);
      expect(dbEntity.attachments[2].originalname).toEqual(file.originalname);
      expect(dbEntity.attachments[2].timestamp).toBe(1000);
      expect(addedFile.filename).toBe('mockfile.doc');
      expect(addedFile._id).toBeDefined();
      expect(addedFile._id.toString()).toBe(dbEntity.attachments[2]._id.toString());
    });

    it('should add the uploaded file to all shared entities and return the file, including its new ID', async () => {
      req.body.allLanguages = 'true';
      spyOn(Date, 'now').and.returnValue(1000);

      const addedFile = await routes.post('/api/attachments/upload', req);
      const dbEntities = await _entities.default.get({ sharedId: 'sharedId' });

      const dbEntity = dbEntities.find(e => e._id.toString() === _fixtures.entityId.toString());
      const dbEntityEn = dbEntities.find(e => e._id.toString() === _fixtures.entityIdEn.toString());
      const dbEntityPt = dbEntities.find(e => e._id.toString() === _fixtures.entityIdPt.toString());

      expect(dbEntity.attachments.length).toBe(3);

      expect(dbEntity.attachments[2]).toEqual(
      expect.objectContaining({
        filename: file.filename,
        originalname: file.originalname,
        _id: addedFile._id,
        timestamp: 1000 }));



      expect(dbEntity.attachments[2]).toEqual(
      expect.objectContaining({
        filename: file.filename,
        originalname: file.originalname,
        _id: addedFile._id,
        timestamp: 1000 }));



      expect(dbEntityEn.attachments.length).toBe(2);
      expect(dbEntityEn.attachments[0].filename).toBe('otherEn.doc');
      expect(dbEntityEn.file.filename).toBe('filenameEn');

      expect(dbEntityEn.attachments[1]._id.toString()).not.toBe(addedFile._id.toString());
      expect(dbEntityEn.attachments[1]).toEqual(
      expect.objectContaining({
        filename: file.filename,
        originalname: file.originalname,
        timestamp: 1000 }));



      expect(dbEntityPt.attachments.length).toBe(1);
      expect(dbEntityPt.file.filename).toBe('filenamePt');
      expect(dbEntityPt.attachments[0]._id.toString()).not.toBe(addedFile._id.toString());
      expect(dbEntityPt.attachments[0]).toEqual(
      expect.objectContaining({
        filename: file.filename,
        originalname: file.originalname,
        timestamp: 1000 }));


    });
  });

  describe('/rename', () => {
    let req;

    beforeEach(() => {
      req = { user: 'admin', body: { entityId: _fixtures.entityId, _id: _fixtures.attachmentToEdit.toString(), originalname: 'edited name' } };
    });

    it('should need authorization', () => {
      expect(routes._post('/api/attachments/rename', { body: { entityId: 'a' } })).toNeedAuthorization();
    });

    it('should have a validation schema', () => {
      expect(routes.post.validation('/api/attachments/rename')).toMatchSnapshot();
    });

    it('should rename a specific attachment', async () => {
      const response = await routes.post('/api/attachments/rename', req);
      expect(response._id.toString()).toBe(_fixtures.attachmentToEdit.toString());
      expect(response.filename).toBe('match.doc');
      expect(response.originalname).toBe('edited name');

      const entity = await _entities.default.getById(req.body.entityId);
      expect(entity.file.originalname).toBe('source doc');
      expect(entity.attachments[0].originalname).toBe('o1');
      expect(entity.attachments[1].originalname).toBe('edited name');
    });

    it('should rename the base file if id matches entity', async () => {
      req.body._id = _fixtures.entityId.toString();
      req.body.originalname = 'edited source name';

      const response = await routes.post('/api/attachments/rename', req);
      expect(response._id.toString()).toBe(_fixtures.entityId.toString());
      expect(response.filename).toBe('filename');
      expect(response.originalname).toBe('edited source name');

      const entity = await _entities.default.getById(req.body.entityId);
      expect(entity.file.originalname).toBe('edited source name');
      expect(entity.attachments[0].originalname).toBe('o1');
      expect(entity.attachments[1].originalname).toBe('common name 2.not');
    });
  });

  describe('/delete', () => {
    beforeEach(async () => {
      spyOn(_relationships.default, 'deleteTextReferences').and.returnValue(Promise.resolve());
      spyOn(_attachments.default, 'delete').and.returnValue(Promise.resolve('response'));
    });

    it('should have a validation schema', () => {
      expect(routes.delete.validation('/api/attachments/delete')).toMatchSnapshot();
    });

    it('should need authorization', () => {
      expect(routes._delete('/api/attachments/delete', { query: { attachmentId: _fixtures.attachmentToDelete } })).toNeedAuthorization();
    });

    it('should call attachments delete and respond the result', async () => {
      const response = await routes.delete('/api/attachments/delete', {
        user: 'admin',
        headers: {},
        query: { attachmentId: _fixtures.entityId } });


      expect(response).toBe('response');
    });
  });
});