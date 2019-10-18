"use strict";var _util = require("util");
var _fs = _interopRequireDefault(require("fs"));
var _path = _interopRequireDefault(require("path"));
var _jasmineHelpers = require("../../utils/jasmineHelpers");
var _testing_db = _interopRequireDefault(require("../../utils/testing_db"));
var _documents = _interopRequireDefault(require("../../documents"));
var _entities2 = _interopRequireDefault(require("../../entities"));
var _entitiesModel = _interopRequireDefault(require("../../entities/entitiesModel"));
var _relationships = _interopRequireDefault(require("../../relationships"));
var _settingsModel = _interopRequireDefault(require("../../settings/settingsModel"));
var _search = _interopRequireDefault(require("../../search/search"));
var _supertest = _interopRequireDefault(require("supertest"));
var _express = _interopRequireDefault(require("express"));

var _fixtures = _interopRequireWildcard(require("./fixtures.js"));
var _instrumentRoutes = _interopRequireDefault(require("../../utils/instrumentRoutes"));
var _routes = _interopRequireDefault(require("../routes.js"));
var _errorLog = _interopRequireDefault(require("../../log/errorLog"));
var _uploads = _interopRequireDefault(require("../uploads.js"));
var _paths = _interopRequireDefault(require("../../config/paths"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}


const writeFile = (0, _util.promisify)(_fs.default.writeFile);
const fileExists = (0, _util.promisify)(_fs.default.stat);

describe('upload routes', () => {
  let routes;
  let req;
  let file;
  let iosocket;
  const sharedId = 'sharedId1';

  const onSocketRespond = (method, url, reqObject, eventName = 'documentProcessed') => {
    const promise = new Promise(resolve => {
      iosocket.emit.and.callFake(event => {
        if (event === eventName) {
          resolve();
        }
      });
    });
    return Promise.all([promise, routes[method](url, reqObject)]);
  };

  const deleteAllFiles = cb => {
    const directory = `${__dirname}/uploads/`;
    const dontDeleteFiles = ['import.zip', 'eng.pdf', 'spn.pdf', 'importcsv.csv', 'f2082bf51b6ef839690485d7153e847a.pdf'];
    _fs.default.readdir(directory, (err, files) => {
      if (err) throw err;

      files.forEach(fileName => {
        if (dontDeleteFiles.includes(fileName)) {
          return;
        }
        _fs.default.unlink(_path.default.join(directory, fileName), error => {
          if (error) throw error;
        });
      });
      cb();
    });
  };

  const checkThumbnails = () => {
    const thumbnail1URI = `${__dirname}/uploads/${_fixtures.entityId}.jpg`;
    const thumbnail2URI = `${__dirname}/uploads/${_fixtures.entityEnId}.jpg`;
    return new Promise((resolve, reject) => {
      _fs.default.stat(_path.default.resolve(thumbnail1URI), err1 => {
        if (err1) {reject(new Error(`Missing thumbnail: ${thumbnail1URI}`));}
        _fs.default.stat(_path.default.resolve(thumbnail2URI), err2 => {
          if (err2) {reject(new Error(`Missing thumbnail: ${thumbnail2URI}`));}
          resolve();
        });
      });
    });
  };

  beforeEach(done => {
    deleteAllFiles(() => {
      spyOn(_search.default, 'delete').and.returnValue(Promise.resolve());
      spyOn(_entities2.default, 'indexEntities').and.returnValue(Promise.resolve());
      iosocket = jasmine.createSpyObj('socket', ['emit']);
      routes = (0, _instrumentRoutes.default)(_routes.default);
      file = {
        fieldname: 'file',
        originalname: 'gadgets-01.pdf',
        encoding: '7bit',
        mimetype: 'application/octet-stream',
        destination: `${__dirname}/uploads/`,
        filename: 'f2082bf51b6ef839690485d7153e847a.pdf',
        path: `${__dirname}/uploads/f2082bf51b6ef839690485d7153e847a.pdf`,
        size: 171411271 };

      req = {
        language: 'es',
        user: 'admin',
        headers: {},
        body: { document: 'sharedId1' },
        files: [file],
        io: {},
        getCurrentSessionSockets: () => ({ sockets: [iosocket], emit: iosocket.emit }) };


      _testing_db.default.clearAllAndLoad(_fixtures.default).then(done).catch((0, _jasmineHelpers.catchErrors)(done));
      spyOn(_errorLog.default, 'error'); //just to avoid annoying console output
    });
  });

  describe('POST/upload', () => {
    it('should process the document after upload', async () => {
      spyOn(Date, 'now').and.returnValue(1000);
      await onSocketRespond('post', '/api/upload', req);
      const [docES, docEN] = await Promise.all([
      _documents.default.get({ sharedId: 'sharedId1', language: 'es' }, '+fullText'),
      _documents.default.get({ sharedId: 'sharedId1', language: 'en' }, '+fullText')]);

      expect(iosocket.emit).toHaveBeenCalledWith('conversionStart', 'sharedId1');
      expect(iosocket.emit).toHaveBeenCalledWith('documentProcessed', 'sharedId1');
      expect(docEN[0].processed).toBe(true);
      expect(docEN[0].fullText[1]).toMatch(/Test\[\[1\]\] file/);
      expect(docEN[0].totalPages).toBe(1);
      expect(docEN[0].language).toBe('en');
      expect(docEN[0].file.filename).toBe(file.filename);
      expect(docEN[0].file.timestamp).toBe(1000);

      expect(docES[0].processed).toBe(true);
      expect(docES[0].fullText[1]).toMatch(/Test\[\[1\]\] file/);
      expect(docES[0].totalPages).toBe(1);
      expect(docES[0].language).toBe('es');
      expect(docES[0].file.filename).toBe(file.filename);
      expect(docES[0].file.timestamp).toBe(1000);

      await checkThumbnails();
    });

    describe('Language detection', () => {
      it('should detect English documents and store the result', async () => {
        file.filename = 'eng.pdf';
        file.path = `${__dirname}/uploads/eng.pdf`;

        await onSocketRespond('post', '/api/upload', req);

        const [docES, docEN] = await Promise.all([
        _documents.default.get({ sharedId: 'sharedId1', language: 'es' }, '+fullText'),
        _documents.default.get({ sharedId: 'sharedId1', language: 'en' }, '+fullText')]);


        expect(docEN[0].file.language).toBe('eng');
        expect(docES[0].file.language).toBe('eng');
      });

      it('should detect Spanish documents and store the result', async () => {
        file.filename = 'spn.pdf';
        file.path = `${__dirname}/uploads/spn.pdf`;

        await onSocketRespond('post', '/api/upload', req);

        const [docES, docEN] = await Promise.all([
        _documents.default.get({ sharedId: 'sharedId1', language: 'es' }, '+fullText'),
        _documents.default.get({ sharedId: 'sharedId1', language: 'en' }, '+fullText')]);

        expect(docEN[0].file.language).toBe('spa');
        expect(docEN[0].file.originalname).toBeDefined();
        expect(docES[0].file.language).toBe('spa');
      });
    });

    describe('when conversion fails', () => {
      it('should set document processed to false and emit a socket conversionFailed event with the id of the document', done => {
        iosocket.emit.and.callFake(eventName => {
          if (eventName === 'conversionFailed') {
            setTimeout(() => {
              _entities2.default.getAllLanguages('sharedId1').
              then(docs => {
                expect(docs[0].processed).toBe(false);
                expect(docs[1].processed).toBe(false);
                done();
              });
            }, 500);
          }
        });

        req.files = ['invalid_file'];
        routes.post('/api/upload', req).
        catch(done.fail);
      });
    });

    describe('when upload finishes', () => {
      it('should update the document with the file path and uploaded flag to true', done => {
        iosocket.emit.and.callFake(eventName => {
          if (eventName === 'documentProcessed') {
            _documents.default.getById('sharedId1', 'es').
            then(modifiedDoc => {
              expect(modifiedDoc.file.originalname).toEqual(file.originalname);
              expect(modifiedDoc.file.filename).toEqual(file.filename);
              expect(modifiedDoc.uploaded).toEqual(true);
              done();
            });
          }
        });
        routes.post('/api/upload', req).
        then(response => {
          expect(response).toEqual(file);
        }).
        catch(done.fail);
      });
    });
  });

  describe('POST/reupload', () => {
    beforeEach(() => {
      spyOn(_relationships.default, 'deleteTextReferences').and.returnValue(Promise.resolve());
    });

    it('should reupload a document', done => {
      iosocket.emit.and.callFake(eventName => {
        if (eventName === 'documentProcessed') {
          expect(_relationships.default.deleteTextReferences).toHaveBeenCalledWith(sharedId, 'es');
          _documents.default.getById(sharedId, 'es').
          then(modifiedDoc => {
            expect(modifiedDoc.toc.length).toBe(0);
            done();
          }).
          catch(done.fail);
        }
      });
      req.body.document = sharedId;

      routes.post('/api/reupload', req).
      then(response => {
        expect(response).toEqual(file);
      }).
      catch(done.fail);
    });

    it('should not remove old document when assigned to other entities', async () => {
      _paths.default.uploadedDocuments = `${__dirname}/uploads/`;
      req.body.document = sharedId;
      await writeFile(`${__dirname}/uploads/test`, 'data');
      await Promise.all([
      _entitiesModel.default.save({ title: 'title', _id: _fixtures.entityId, file: { filename: 'test' } }),
      _entitiesModel.default.save({ title: 'title', file: { filename: 'test' } })]);

      await onSocketRespond('post', '/api/reupload', req);
      await fileExists(_path.default.resolve(`${__dirname}/uploads/test`));
    });

    it('should remove old document on reupload', async () => {
      _paths.default.uploadedDocuments = `${__dirname}/uploads/`;
      req.body.document = sharedId;
      await writeFile(`${__dirname}/uploads/test`, 'data');

      await _entitiesModel.default.save({ _id: _fixtures.entityId, file: { filename: 'test' } });
      await onSocketRespond('post', '/api/reupload', req);

      try {
        await fileExists(_path.default.resolve(`${__dirname}/uploads/test`));
        fail('file should be deleted on reupload');
      } catch (e) {} //eslint-disable-line
    });

    it('should upload too all entities when none has file', async () => {
      spyOn(Date, 'now').and.returnValue(1100);
      _paths.default.uploadedDocuments = `${__dirname}/uploads/`;
      req.body.document = sharedId;
      await writeFile(`${__dirname}/uploads/test`, 'data');
      await _entitiesModel.default.save({ _id: _fixtures.entityId, file: null });
      await onSocketRespond('post', '/api/reupload', req);

      const _entities = await _entities2.default.get({ sharedId });
      const _file = {
        filename: 'f2082bf51b6ef839690485d7153e847a.pdf',
        language: 'other',
        mimetype: 'application/octet-stream',
        originalname: 'gadgets-01.pdf',
        size: 171411271,
        timestamp: 1100 };

      expect(_entities[0].file).toEqual(_file);
      expect(_entities[1].file).toEqual(_file);
    });
  });

  describe('POST/customisation/upload', () => {
    it('should save the upload and return it', async () => {
      const result = await routes.post('/api/customisation/upload', req);
      delete result._id;
      delete result.creationDate;
      expect(result).toMatchSnapshot();
    });
  });

  describe('GET/customisation/upload', () => {
    it('should return all uploads', async () => {
      const result = await routes.get('/api/customisation/upload', {});
      expect(result.map(r => r.originalname)).toMatchSnapshot();
    });
  });

  describe('DELETE/customisation/upload', () => {
    it('should have a validation schema', () => {
      expect(routes.delete.validation('/api/customisation/upload')).toMatchSnapshot();
    });

    it('should delete upload and return the response', async () => {
      spyOn(_uploads.default, 'delete').and.returnValue(Promise.resolve('upload_deleted'));
      const result = await routes.delete('/api/customisation/upload', { query: { _id: 'upload_id' } });
      expect(result).toBe('upload_deleted');
      expect(_uploads.default.delete).toHaveBeenCalledWith('upload_id');
    });
  });

  describe('POST/import', () => {
    beforeEach(() => {
      file = {
        fieldname: 'file',
        originalname: 'importcsv.csv',
        encoding: '7bit',
        mimetype: 'application/octet-stream',
        destination: `${__dirname}/uploads/`,
        filename: 'importcsv.csv',
        path: `${__dirname}/uploads/importcsv.csv`,
        size: 112 };

      req = {
        language: 'es',
        user: 'admin',
        headers: {},
        body: { template: _fixtures.templateId },
        files: [file],
        io: {},
        getCurrentSessionSockets: () => ({ sockets: [iosocket], emit: iosocket.emit }) };

    });

    it('should import a csv', done => {
      let start = false;
      let progress = 0;
      iosocket.emit.and.callFake((eventName, data) => {
        if (eventName === 'IMPORT_CSV_PROGRESS') {
          progress = data;
        }
        if (eventName === 'IMPORT_CSV_START') {
          start = true;
        }
        if (eventName === 'IMPORT_CSV_END') {
          expect(start).toBe(true);
          expect(progress).toBe(2);
          _entities2.default.get({ template: _fixtures.templateId }).
          then(entitiesCreated => {
            expect(entitiesCreated.length).toBe(2);
            expect(entitiesCreated[0].title).toBe('imported entity one');
            expect(entitiesCreated[1].title).toBe('imported entity two');
            done();
          });
        }
      });

      routes.post('/api/import', req);
    });

    describe('on error', () => {
      it('should emit the error', done => {
        file.path = `${__dirname}/uploads/import.zip`;
        iosocket.emit.and.callFake((eventName, data) => {
          if (eventName === 'IMPORT_CSV_ERROR') {
            expect(data.code).toBe(500);
            done();
          }
        });
        routes.post('/api/import', req);
      });
    });
  });

  describe('api/public', () => {
    beforeEach(done => {
      deleteAllFiles(() => {
        spyOn(Date, 'now').and.returnValue(1000);
        _paths.default.uploadedDocuments = `${__dirname}/uploads/`;
        const buffer = _fs.default.readFileSync(`${__dirname}/12345.test.pdf`);
        file = {
          fieldname: 'file',
          originalname: 'gadgets-01.pdf',
          encoding: '7bit',
          mimetype: 'application/octet-stream',
          buffer };


        const attachment = {
          fieldname: 'attachment0',
          originalname: 'attachment-01.pdf',
          encoding: '7bit',
          mimetype: 'application/octet-stream',
          buffer };

        req = {
          language: 'es',
          headers: {},
          body: { title: 'public submit', template: _fixtures.templateId.toString() },
          files: [file, attachment],
          io: {},
          getCurrentSessionSockets: () => ({ sockets: [iosocket], emit: iosocket.emit }) };

        done();
      });
    });

    it('should create the entity and store the files', async () => {
      await onSocketRespond('post', '/api/public', req);
      const [newEntity] = await _entities2.default.get({ title: 'public submit' });
      expect(newEntity.title).toBe('public submit');
      expect(newEntity.file.originalname).toBe('gadgets-01.pdf');
      expect(newEntity.processed).toBe(true);
      expect(newEntity.attachments.length).toBe(1);
      expect(newEntity.attachments[0].originalname).toBe('attachment-01.pdf');
      expect(_fs.default.existsSync(_path.default.resolve(`${__dirname}/uploads/${newEntity.file.filename}`))).toBe(true);
      expect(_fs.default.existsSync(_path.default.resolve(`${__dirname}/uploads/${newEntity.attachments[0].filename}`))).toBe(true);
    });

    it('should not create entity if settings has no allowedPublicTemplates option', async () => {
      const [settingsObject] = await _settingsModel.default.get();
      delete settingsObject.allowedPublicTemplates;
      await _settingsModel.default.db.replaceOne({}, settingsObject);
      try {
        await routes.post('/api/public', req);
        fail('should return error');
      } catch (e) {
        expect(e.message).toMatch(/unauthorized public template/i);
        expect(e.code).toBe(403);
      }
      const res = await _entities2.default.get({ title: 'public submit' });
      expect(res.length).toBe(0);
    });

    it('should not create entity if template is not whitelisted in allowedPublicTemplates setting', async () => {
      req.body.template = 'unknownTemplate';
      try {
        await routes.post('/api/public', req);
        fail('should return error');
      } catch (e) {
        expect(e.message).toMatch(/unauthorized public template/i);
        expect(e.code).toBe(403);
      }
      const res = await _entities2.default.get({ title: 'public submit' });
      expect(res.length).toBe(0);
    });
  });

  describe('/remotepublic', () => {
    let app;
    let remoteApp;
    beforeEach(() => {
      app = (0, _express.default)();
      app.use((_req, res, next) => {
        _req.session = { remotecookie: 'connect.ssid: 12n32ndi23j4hsj;' }; //eslint-disable-line
        next();
      });
      (0, _routes.default)(app);
    });

    it('should return the captcha and store its value in session', done => {
      remoteApp = (0, _express.default)();
      remoteApp.post('/api/public', (_req, res) => {
        expect(_req.headers.cookie).toBe('connect.ssid: 12n32ndi23j4hsj;');
        res.json('ok');
      });

      const remoteServer = remoteApp.listen(54321, async () => {
        await (0, _supertest.default)(app).
        post('/api/remotepublic').
        send({ title: 'Title' }).
        expect(200);
        remoteServer.close();
        done();
      });
    });
  });


  afterAll(done => {
    deleteAllFiles(() => {
      _testing_db.default.disconnect().then(done);
    });
  });
});