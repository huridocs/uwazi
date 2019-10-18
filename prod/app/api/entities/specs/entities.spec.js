"use strict";
var _jasmineHelpers = require("../../utils/jasmineHelpers");
var _date = _interopRequireDefault(require("../../utils/date.js"));
var _testing_db = _interopRequireDefault(require("../../utils/testing_db"));
var _entitiesModel = _interopRequireDefault(require("../entitiesModel"));
var _fs = _interopRequireDefault(require("fs"));
var _relationships = _interopRequireDefault(require("../../relationships"));
var _search = _interopRequireDefault(require("../../search/search"));
var _paths = _interopRequireDefault(require("../../config/paths"));
var _path = _interopRequireDefault(require("path"));
var _entities2 = _interopRequireDefault(require("../entities.js"));
var _fixtures = _interopRequireWildcard(require("./fixtures.js"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function ownKeys(object, enumerableOnly) {var keys = Object.keys(object);if (Object.getOwnPropertySymbols) {keys.push.apply(keys, Object.getOwnPropertySymbols(object));}if (enumerableOnly) keys = keys.filter(function (sym) {return Object.getOwnPropertyDescriptor(object, sym).enumerable;});return keys;}function _objectSpread(target) {for (var i = 1; i < arguments.length; i++) {if (i % 2) {var source = arguments[i] != null ? arguments[i] : {};ownKeys(source, true).forEach(function (key) {_defineProperty(target, key, source[key]);});} else if (Object.getOwnPropertyDescriptors) {Object.defineProperties(target, Object.getOwnPropertyDescriptors(arguments[i]));} else {ownKeys(source).forEach(function (key) {Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(arguments[i], key));});}}return target;}function _defineProperty(obj, key, value) {if (key in obj) {Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });} else {obj[key] = value;}return obj;}


describe('entities', () => {
  beforeEach(done => {
    spyOn(_relationships.default, 'saveEntityBasedReferences').and.returnValue(Promise.resolve());
    spyOn(_search.default, 'delete').and.returnValue(Promise.resolve());
    spyOn(_search.default, 'bulkIndex').and.returnValue(Promise.resolve());
    _testing_db.default.clearAllAndLoad(_fixtures.default).then(done).catch((0, _jasmineHelpers.catchErrors)(done));
  });

  afterAll(done => {
    _testing_db.default.disconnect().then(done);
  });

  describe('save', () => {
    const saveDoc = async (doc, user) => {
      await _entities2.default.save(doc, { user, language: 'es' });
      const docs = await _entities2.default.get({ title: doc.title });
      return { createdDocumentEs: docs.find(d => d.language === 'es'), createdDocumentEn: docs.find(d => d.language === 'en') };
    };

    it('should uniq the values on multiselect and relationship fields', done => {
      const entity = {
        title: 'Batman begins',
        template: _fixtures.templateId,
        metadata: {
          multiselect: ['id1', 'id2', 'id2', 'id1', 'id3'],
          friends: ['id1', 'id2', 'id2', 'id1', 'id3', 'id3'] } };


      const user = {};

      _entities2.default.save(entity, { user, language: 'es' }).
      then(e => _entities2.default.getById(e._id)).
      then(createdEntity => {
        expect(createdEntity.metadata.multiselect).toEqual(['id1', 'id2', 'id3']);
        expect(createdEntity.metadata.friends).toEqual(['id1', 'id2', 'id3']);
        done();
      }).
      catch((0, _jasmineHelpers.catchErrors)(done));
    });

    it('should create a new entity for each language in settings with a language property, a shared id, and default template', async () => {
      const universalTime = 1;
      spyOn(_date.default, 'currentUTC').and.returnValue(universalTime);
      const doc = { title: 'Batman begins' };
      const user = { _id: _testing_db.default.id() };

      const { createdDocumentEs, createdDocumentEn } = await saveDoc(doc, user);

      expect(createdDocumentEs.sharedId).toBe(createdDocumentEn.sharedId);

      expect(createdDocumentEs.template.toString()).toBe(_fixtures.templateChangingNames.toString());
      expect(createdDocumentEn.template.toString()).toBe(_fixtures.templateChangingNames.toString());

      expect(createdDocumentEs.title).toBe(doc.title);
      expect(createdDocumentEs.user.equals(user._id)).toBe(true);
      expect(createdDocumentEs.published).toBe(false);
      expect(createdDocumentEs.creationDate).toEqual(universalTime);

      expect(createdDocumentEn.title).toBe(doc.title);
      expect(createdDocumentEn.user.equals(user._id)).toBe(true);
      expect(createdDocumentEn.published).toBe(false);
      expect(createdDocumentEn.creationDate).toEqual(universalTime);
    });

    it('should create a new entity, preserving template if passed', async () => {
      const doc = { title: 'The Dark Knight', template: _fixtures.templateId };
      const user = { _id: _testing_db.default.id() };
      const { createdDocumentEs, createdDocumentEn } = await saveDoc(doc, user);

      expect(createdDocumentEs.template.toString()).toBe(_fixtures.templateId.toString());
      expect(createdDocumentEn.template.toString()).toBe(_fixtures.templateId.toString());
    });

    it('should return the newly created document for the passed language', done => {
      const doc = { title: 'the dark knight', fullText: 'the full text!', metadata: { data: 'should not be here' } };
      const user = { _id: _testing_db.default.id() };

      _entities2.default.save(doc, { user, language: 'en' }).
      then(createdDocument => {
        expect(createdDocument._id).toBeDefined();
        expect(createdDocument.title).toBe(doc.title);
        expect(createdDocument.user.equals(user._id)).toBe(true);
        expect(createdDocument.language).toEqual('en');
        expect(createdDocument.fullText).not.toBeDefined();
        expect(createdDocument.metadata).not.toBeDefined();
        done();
      }).
      catch((0, _jasmineHelpers.catchErrors)(done));
    });

    it('should return updated entity', done => {
      const doc = { title: 'the dark knight', fullText: 'the full text!', metadata: { data: 'should not be here' } };
      const user = { _id: _testing_db.default.id() };

      _entities2.default.save(doc, { user, language: 'en' }).
      then(createdDocument => _entities2.default.save(_objectSpread({}, createdDocument, { title: 'updated title' }), { user, language: 'en' })).
      then(updatedDocument => {
        expect(updatedDocument.title).toBe('updated title');
        done();
      }).
      catch((0, _jasmineHelpers.catchErrors)(done));
    });

    it('should index the newly created documents', done => {
      spyOn(_entities2.default, 'indexEntities').and.returnValue(Promise.resolve());
      const doc = { title: 'the dark knight', template: _fixtures.templateId };
      const user = { _id: _testing_db.default.id() };

      _entities2.default.save(doc, { user, language: 'en' }).
      then(() => {
        expect(_entities2.default.indexEntities).toHaveBeenCalled();
        done();
      }).
      catch((0, _jasmineHelpers.catchErrors)(done));
    });

    it('should allow partial saves with correct full indexing (NOTE!: partial update requires sending sharedId)', done => {
      spyOn(_entities2.default, 'indexEntities').and.returnValue(Promise.resolve());
      const partialDoc = { _id: _fixtures.batmanFinishesId, sharedId: 'shared', title: 'Updated title' };
      _entities2.default.save(partialDoc, { language: 'en' }).
      then(() => _entities2.default.getById(_fixtures.batmanFinishesId)).
      then(savedEntity => {
        expect(savedEntity.title).toBe('Updated title');
        expect(savedEntity.metadata).toEqual({ property1: 'value1' });
        expect(_entities2.default.indexEntities).toHaveBeenCalled();
        done();
      }).
      catch(done.fail);
    });

    describe('when other languages have no metadata', () => {
      it('should replicate metadata being saved', done => {
        const doc = { _id: _fixtures.batmanFinishesId, sharedId: 'shared', metadata: { text: 'newMetadata' }, template: _fixtures.templateId };

        _entities2.default.save(doc, { language: 'en' }).
        then(updatedDoc => {
          expect(updatedDoc.language).toBe('en');
          return Promise.all([
          _entities2.default.getById('shared', 'es'),
          _entities2.default.getById('shared', 'en'),
          _entities2.default.getById('shared', 'pt')]);

        }).
        then(([docES, docEN, docPT]) => {
          expect(docEN.published).toBe(true);
          expect(docES.published).toBe(true);
          expect(docPT.published).toBe(true);

          expect(docEN.metadata.text).toBe('newMetadata');
          expect(docES.metadata.text).toBe('newMetadata');
          expect(docPT.metadata.text).toBe('test');
          done();
        }).
        catch((0, _jasmineHelpers.catchErrors)(done));
      });
    });

    describe('when other languages have the same file', () => {
      it('should replicate the toc being saved', done => {
        const doc = {
          _id: _fixtures.batmanFinishesId,
          sharedId: 'shared',
          metadata: { text: 'newMetadata' },
          template: _fixtures.templateId,
          toc: [{ label: 'entry1' }],
          file: { filename: '8202c463d6158af8065022d9b5014cc1.pdf' } };


        _entities2.default.save(doc, { language: 'en' }).
        then(updatedDoc => {
          expect(updatedDoc.language).toBe('en');
          return Promise.all([
          _entities2.default.getById('shared', 'es'),
          _entities2.default.getById('shared', 'en'),
          _entities2.default.getById('shared', 'pt')]);

        }).
        then(([docES, docEN, docPT]) => {
          expect(docEN.published).toBe(true);
          expect(docES.published).toBe(true);
          expect(docPT.published).toBe(true);

          expect(docEN.toc[0].label).toBe(doc.toc[0].label);
          expect(docES.toc).toBeUndefined();
          expect(docPT.toc[0].label).toBe(doc.toc[0].label);
          done();
        }).
        catch((0, _jasmineHelpers.catchErrors)(done));
      });
    });

    describe('when published/template property changes', () => {
      it('should replicate the change for all the languages', done => {
        const doc = { _id: _fixtures.batmanFinishesId, sharedId: 'shared', metadata: {}, published: false, template: _fixtures.templateId };

        _entities2.default.save(doc, { language: 'en' }).
        then(updatedDoc => {
          expect(updatedDoc.language).toBe('en');
          return Promise.all([
          _entities2.default.getById('shared', 'es'),
          _entities2.default.getById('shared', 'en')]);

        }).
        then(([docES, docEN]) => {
          expect(docEN.template).toBeDefined();
          expect(docES.template).toBeDefined();

          expect(docES.published).toBe(false);
          expect(docES.template.equals(_fixtures.templateId)).toBe(true);
          expect(docEN.published).toBe(false);
          expect(docEN.template.equals(_fixtures.templateId)).toBe(true);
          done();
        }).
        catch((0, _jasmineHelpers.catchErrors)(done));
      });
    });

    it('should sync select/multiselect/dates/multidate/multidaterange/numeric', done => {
      const doc = { _id: _fixtures.syncPropertiesEntityId,
        sharedId: 'shared1',
        template: _fixtures.templateId,
        metadata: {
          text: 'changedText',
          select: 'select',
          multiselect: 'multiselect',
          date: 'date',
          multidate: [1234],
          multidaterange: [{ from: 1, to: 2 }],
          numeric: 100 } };



      _entities2.default.save(doc, { language: 'en' }).
      then(updatedDoc => {
        expect(updatedDoc.language).toBe('en');
        return Promise.all([
        _entities2.default.getById('shared1', 'en'),
        _entities2.default.getById('shared1', 'es'),
        _entities2.default.getById('shared1', 'pt')]);

      }).
      then(([docEN, docES, docPT]) => {
        expect(docEN.metadata.text).toBe('changedText');
        expect(docEN.metadata.select).toBe('select');
        expect(docEN.metadata.multiselect).toBe('multiselect');
        expect(docEN.metadata.date).toBe('date');
        expect(docEN.metadata.multidate).toEqual([1234]);
        expect(docEN.metadata.multidaterange).toEqual([{ from: 1, to: 2 }]);
        expect(docEN.metadata.numeric).toEqual(100);

        expect(docES.metadata.property1).toBe('text');
        expect(docES.metadata.select).toBe('select');
        expect(docES.metadata.multiselect).toBe('multiselect');
        expect(docES.metadata.date).toBe('date');
        expect(docES.metadata.multidate).toEqual([1234]);
        expect(docES.metadata.multidaterange).toEqual([{ from: 1, to: 2 }]);
        expect(docES.metadata.numeric).toEqual(100);


        expect(docPT.metadata.property1).toBe('text');
        expect(docPT.metadata.select).toBe('select');
        expect(docPT.metadata.multiselect).toBe('multiselect');
        expect(docPT.metadata.date).toBe('date');
        expect(docPT.metadata.multidate).toEqual([1234]);
        expect(docPT.metadata.multidaterange).toEqual([{ from: 1, to: 2 }]);
        expect(docPT.metadata.numeric).toEqual(100);
        done();
      }).
      catch((0, _jasmineHelpers.catchErrors)(done));
    });

    it('should saveEntityBasedReferences', done => {
      spyOn(_date.default, 'currentUTC').and.returnValue(1);
      const doc = { title: 'Batman begins', template: _fixtures.templateId };
      const user = { _id: _testing_db.default.id() };

      _entities2.default.save(doc, { user, language: 'es' }).
      then(() => {
        expect(_relationships.default.saveEntityBasedReferences.calls.argsFor(0)[0].title).toBe('Batman begins');
        expect(_relationships.default.saveEntityBasedReferences.calls.argsFor(0)[0]._id).toBeDefined();
        done();
      }).
      catch((0, _jasmineHelpers.catchErrors)(done));
    });

    describe('when document have _id', () => {
      it('should not assign again user and creation date', done => {
        spyOn(_date.default, 'currentUTC').and.returnValue(10);
        const modifiedDoc = { _id: _fixtures.batmanFinishesId, sharedId: 'shared' };
        return _entities2.default.save(modifiedDoc, { user: 'another_user', language: 'en' }).
        then(() => _entities2.default.getById('shared', 'en')).
        then(doc => {
          expect(doc.user).not.toBe('another_user');
          expect(doc.creationDate).not.toBe(10);
          done();
        }).
        catch((0, _jasmineHelpers.catchErrors)(done));
      });
    });
  });

  describe('updateMetdataFromRelationships', () => {
    it('should update the metdata based on the entity relationships', done => {
      _entities2.default.updateMetdataFromRelationships(['shared', 'missingEntity'], 'en').
      then(() => _entities2.default.getById('shared', 'en')).
      then(updatedEntity => {
        expect(updatedEntity.metadata.friends).toEqual(['shared2']);
        done();
      });
    });

    it('should not fail on newly created documents (without metadata)', async () => {
      const doc = { title: 'Batman begins', template: _fixtures.templateId };
      const user = { _id: _testing_db.default.id() };
      const newEntity = await _entities2.default.save(doc, { user, language: 'es' });

      await _entities2.default.updateMetdataFromRelationships([newEntity.sharedId], 'es');
      const updatedEntity = await _entities2.default.getById(newEntity.sharedId, 'en');
      expect(updatedEntity.metadata).toEqual({
        date: null, daterange: null, friends: [], multidate: null, multidaterange: null, multiselect: null, select: null, numeric: null });

    });
  });

  describe('Sanitize', () => {
    it('should sanitize multidates, removing non valid dates', done => {
      const doc = {
        _id: _fixtures.batmanFinishesId,
        sharedId: 'shared',
        metadata: { multidate: [null, 1234, null, 5678] },
        published: false,
        template: _fixtures.templateId };


      _entities2.default.save(doc, { language: 'en' }).
      then(updatedDoc => {
        expect(updatedDoc.language).toBe('en');
        return Promise.all([
        _entities2.default.getById('shared', 'es'),
        _entities2.default.getById('shared', 'en')]);

      }).
      then(([docES, docEN]) => {
        expect(docES.metadata.multidate).toEqual([1234, 5678]);
        expect(docEN.metadata.multidate).toEqual([1234, 5678]);
        done();
      }).
      catch((0, _jasmineHelpers.catchErrors)(done));
    });

    it('should sanitize select, removing empty values', done => {
      const doc = {
        _id: _fixtures.batmanFinishesId,
        sharedId: 'shared',
        metadata: { select: '' },
        published: false,
        template: _fixtures.templateId };


      _entities2.default.save(doc, { language: 'en' }).
      then(updatedDoc => {
        expect(updatedDoc.language).toBe('en');
        return Promise.all([
        _entities2.default.getById('shared', 'es'),
        _entities2.default.getById('shared', 'en')]);

      }).
      then(([docES, docEN]) => {
        expect(docES.metadata.select).toEqual(null);
        expect(docEN.metadata.select).toEqual(null);
        done();
      }).
      catch((0, _jasmineHelpers.catchErrors)(done));
    });
    it('should sanitize daterange, removing non valid dates', done => {
      const doc1 = { _id: _fixtures.batmanFinishesId, sharedId: 'shared', metadata: { daterange: { from: 1, to: 2 } }, template: _fixtures.templateId };
      const doc2 = { _id: _fixtures.batmanFinishesId, sharedId: 'shared', metadata: { daterange: { from: null, to: 2 } }, template: _fixtures.templateId };
      const doc3 = { _id: _fixtures.batmanFinishesId, sharedId: 'shared', metadata: { daterange: { from: 2, to: null } }, template: _fixtures.templateId };
      const doc4 = { _id: _fixtures.batmanFinishesId, sharedId: 'shared', metadata: { daterange: { from: null, to: null } }, template: _fixtures.templateId };

      _entities2.default.save(doc1, { language: 'en' }).then(() => _entities2.default.getById('shared', 'en')).
      then(doc => {
        expect(doc.metadata.daterange).toEqual(doc1.metadata.daterange);
        return _entities2.default.save(doc2, { language: 'en' }).then(() => _entities2.default.getById('shared', 'en'));
      }).
      then(doc => {
        expect(doc.metadata.daterange).toEqual(doc2.metadata.daterange);
        return _entities2.default.save(doc3, { language: 'en' }).then(() => _entities2.default.getById('shared', 'en'));
      }).
      then(doc => {
        expect(doc.metadata.daterange).toEqual(doc3.metadata.daterange);
        return _entities2.default.save(doc4, { language: 'en' }).then(() => _entities2.default.getById('shared', 'en'));
      }).
      then(doc => {
        expect(doc.metadata.daterange).not.toBeDefined();
        done();
      }).
      catch((0, _jasmineHelpers.catchErrors)(done));
    });

    it('should sanitize multidaterange, removing non valid dates', done => {
      const doc = { _id: _fixtures.batmanFinishesId,
        sharedId: 'shared',
        metadata: { multidaterange: [
          { from: 1, to: 2 },
          { from: null, to: null },
          { from: null, to: 2 },
          { from: 2, to: null },
          { from: null, to: null }] },

        published: false,
        template: _fixtures.templateId };

      _entities2.default.save(doc, { language: 'en' }).
      then(updatedDoc => {
        expect(updatedDoc.language).toBe('en');
        return Promise.all([
        _entities2.default.getById('shared', 'es'),
        _entities2.default.getById('shared', 'en')]);

      }).
      then(([docES, docEN]) => {
        expect(docES.metadata.multidaterange).toEqual([{ from: 1, to: 2 }, { from: null, to: 2 }, { from: 2, to: null }]);
        expect(docEN.metadata.multidaterange).toEqual([{ from: 1, to: 2 }, { from: null, to: 2 }, { from: 2, to: null }]);
        done();
      }).
      catch((0, _jasmineHelpers.catchErrors)(done));
    });
  });

  describe('indexEntities', () => {
    it('should index entities based on query params passed', done => {
      _entities2.default.indexEntities({ sharedId: 'shared' }).
      then(() => {
        const documentsToIndex = _search.default.bulkIndex.calls.argsFor(0)[0];
        expect(documentsToIndex[0].title).toBeDefined();
        expect(documentsToIndex[0].fullText).not.toBeDefined();
        expect(documentsToIndex[0].relationships.length).toBe(4);

        expect(documentsToIndex[1].title).toBeDefined();
        expect(documentsToIndex[1].fullText).not.toBeDefined();
        expect(documentsToIndex[1].relationships.length).toBe(4);

        expect(documentsToIndex[2].title).toBeDefined();
        expect(documentsToIndex[2].fullText).not.toBeDefined();
        expect(documentsToIndex[2].relationships.length).toBe(4);
        done();
      }).
      catch((0, _jasmineHelpers.catchErrors)(done));
    });

    it('should index entities withh fullText', done => {
      _entities2.default.indexEntities({ sharedId: 'shared' }, '+fullText').
      then(() => {
        const documentsToIndex = _search.default.bulkIndex.calls.argsFor(0)[0];
        expect(documentsToIndex[0].title).toBeDefined();
        expect(documentsToIndex[0].fullText).toBeDefined();
        expect(documentsToIndex[0].relationships.length).toBe(4);

        expect(documentsToIndex[1].title).toBeDefined();
        expect(documentsToIndex[1].relationships.length).toBe(4);

        expect(documentsToIndex[2].title).toBeDefined();
        expect(documentsToIndex[2].relationships.length).toBe(4);
        done();
      }).
      catch((0, _jasmineHelpers.catchErrors)(done));
    });
  });

  describe('get', () => {
    it('should return matching entities for the conditions', done => {
      const sharedId = 'shared1';

      Promise.all([
      _entities2.default.get({ sharedId, language: 'en' }),
      _entities2.default.get({ sharedId, language: 'es' })]).

      then(([enDoc, esDoc]) => {
        expect(enDoc[0].title).toBe('EN');
        expect(esDoc[0].title).toBe('ES');
        done();
      }).
      catch((0, _jasmineHelpers.catchErrors)(done));
    });
  });

  describe('countByTemplate', () => {
    it('should return how many entities using the template passed', done => {
      _entities2.default.countByTemplate(_fixtures.templateId).
      then(count => {
        expect(count).toBe(5);
        done();
      }).
      catch(done.fail);
    });

    it('should return 0 when no count found', done => {
      _entities2.default.countByTemplate(_testing_db.default.id()).
      then(count => {
        expect(count).toBe(0);
        done();
      }).
      catch(done.fail);
    });
  });

  describe('getByTemplate', () => {
    it('should return only published entities with passed template and language', done => {
      _entities2.default.getByTemplate(_fixtures.templateId, 'en').
      then(docs => {
        expect(docs.length).toBe(2);
        expect(docs[0].title).toBe('Batman finishes');
        expect(docs[1].title).toBe('EN');
        done();
      }).
      catch(done.fail);
    });

    it('should return all entities (including unpublished) if required', done => {
      _entities2.default.getByTemplate(_fixtures.templateId, 'en', false).
      then(docs => {
        expect(docs.length).toBe(3);
        expect(docs[0].title).toBe('Batman finishes');
        expect(docs[1].title).toBe('Unpublished entity');
        expect(docs[2].title).toBe('EN');
        done();
      }).
      catch(done.fail);
    });
  });

  describe('multipleUpdate()', () => {
    it('should save() all the entities with the new metadata', done => {
      spyOn(_entities2.default, 'save').and.returnValue(Promise.resolve());
      const metadata = { property1: 'new text', description: 'yeah!' };
      _entities2.default.multipleUpdate(['shared', 'shared1'], { metadata }, { language: 'en' }).
      then(() => {
        expect(_entities2.default.save).toHaveBeenCalled();
        expect(_entities2.default.save).toHaveBeenCalled();
        expect(_entities2.default.save.calls.argsFor(0)[0].metadata).toEqual(metadata);
        expect(_entities2.default.save.calls.argsFor(1)[0].metadata).toEqual(metadata);
        done();
      }).
      catch((0, _jasmineHelpers.catchErrors)(done));
    });
  });

  describe('saveMultiple()', () => {
    it('should allow partial saves with correct full indexing', done => {
      spyOn(_entities2.default, 'indexEntities').and.returnValue(Promise.resolve());
      const partialDoc = { _id: _fixtures.batmanFinishesId, sharedId: 'shared', title: 'Updated title' };
      const partialDoc2 = { _id: _fixtures.syncPropertiesEntityId, sharedId: 'shared', title: 'Updated title 2' };
      _entities2.default.saveMultiple([partialDoc, partialDoc2]).
      then(response => Promise.all([response, _entities2.default.getById(_fixtures.batmanFinishesId)])).
      then(([response, savedEntity]) => {
        const expectedQuery = {
          _id: { $in: [_fixtures.batmanFinishesId, _fixtures.syncPropertiesEntityId] } };


        expect(response[0]._id.toString()).toBe(_fixtures.batmanFinishesId.toString());
        expect(savedEntity.title).toBe('Updated title');
        expect(savedEntity.metadata).toEqual({ property1: 'value1' });
        expect(_entities2.default.indexEntities).toHaveBeenCalledWith(expectedQuery, '+fullText');
        done();
      }).
      catch(done.fail);
    });
  });

  describe('updateMetadataProperties', () => {
    let currentTemplate;
    beforeEach(() => {
      currentTemplate = {
        _id: _fixtures.templateChangingNames,
        properties: [
        { id: '1', type: 'text', name: 'property1' },
        { id: '2', type: 'text', name: 'property2' },
        { id: '3', type: 'text', name: 'property3' },
        { type: 'text', label: 'new property' }] };


    });

    it('should do nothing when there is no changed or deleted properties', done => {
      spyOn(_entitiesModel.default.db, 'updateMany');

      _entities2.default.updateMetadataProperties(currentTemplate, currentTemplate).
      then(() => {
        expect(_entitiesModel.default.db.updateMany).not.toHaveBeenCalled();
        done();
      }).
      catch((0, _jasmineHelpers.catchErrors)(done));
    });

    it('should update property names on entities based on the changes to the template', done => {
      spyOn(_entities2.default, 'indexEntities').and.returnValue(Promise.resolve());
      const template = { _id: _fixtures.templateChangingNames,
        properties: [
        { id: '1', type: 'text', name: 'property1', label: 'new name1' },
        { id: '2', type: 'text', name: 'property2', label: 'new name2' },
        { id: '3', type: 'text', name: 'property3', label: 'property3' }] };


      _entities2.default.updateMetadataProperties(template, currentTemplate).
      then(() => Promise.all([
      _entities2.default.get({ template: _fixtures.templateChangingNames }),
      _entities2.default.getById('shared', 'en')])).

      then(([docs, docDiferentTemplate]) => {
        expect(docs[0].metadata.new_name1).toBe('value1');
        expect(docs[0].metadata.new_name2).toBe('value2');
        expect(docs[0].metadata.property3).toBe('value3');

        expect(docs[1].metadata.new_name1).toBe('value1');
        expect(docs[1].metadata.new_name2).toBe('value2');
        expect(docs[1].metadata.property3).toBe('value3');

        expect(docDiferentTemplate.metadata.property1).toBe('value1');
        expect(_entities2.default.indexEntities).toHaveBeenCalledWith({ template: template._id }, null, 1000);
        done();
      }).
      catch((0, _jasmineHelpers.catchErrors)(done));
    });

    it('should delete and rename properties passed', done => {
      const template = { _id: _fixtures.templateChangingNames,
        properties: [
        { id: '2', type: 'text', name: 'property2', label: 'new name' }] };


      _entities2.default.updateMetadataProperties(template, currentTemplate).
      then(() => _entities2.default.get({ template: _fixtures.templateChangingNames })).
      then(docs => {
        expect(docs[0].metadata.property1).not.toBeDefined();
        expect(docs[0].metadata.new_name).toBe('value2');
        expect(docs[0].metadata.property2).not.toBeDefined();
        expect(docs[0].metadata.property3).not.toBeDefined();

        expect(docs[1].metadata.property1).not.toBeDefined();
        expect(docs[1].metadata.new_name).toBe('value2');
        expect(docs[1].metadata.property2).not.toBeDefined();
        expect(docs[1].metadata.property3).not.toBeDefined();
        done();
      }).
      catch((0, _jasmineHelpers.catchErrors)(done));
    });

    it('should delete missing properties', done => {
      const template = { _id: _fixtures.templateChangingNames,
        properties: [
        { id: '2', type: 'text', name: 'property2', label: 'property2' }] };


      _entities2.default.updateMetadataProperties(template, currentTemplate).
      then(() => _entities2.default.get({ template: _fixtures.templateChangingNames })).
      then(docs => {
        expect(docs[0].metadata.property1).not.toBeDefined();
        expect(docs[0].metadata.property2).toBeDefined();
        expect(docs[0].metadata.property3).not.toBeDefined();

        expect(docs[1].metadata.property1).not.toBeDefined();
        expect(docs[1].metadata.property2).toBeDefined();
        expect(docs[1].metadata.property3).not.toBeDefined();
        done();
      }).
      catch((0, _jasmineHelpers.catchErrors)(done));
    });
  });

  describe('removeValuesFromEntities', () => {
    it('should remove values of properties passed on all entities having that property', done => {
      spyOn(_entities2.default, 'indexEntities').and.returnValue(Promise.resolve());
      _entities2.default.removeValuesFromEntities({ multiselect: [] }, _fixtures.templateWithEntityAsThesauri).
      then(() => _entities2.default.get({ template: _fixtures.templateWithEntityAsThesauri })).
      then(_entities => {
        expect(_entities[0].metadata.multiselect).toEqual([]);
        expect(_entities2.default.indexEntities).toHaveBeenCalled();
        done();
      }).
      catch((0, _jasmineHelpers.catchErrors)(done));
    });
  });

  describe('delete', () => {
    describe('when the original file does not exist', () => {
      it('should delete the entity and not throw an error', done => {
        _entities2.default.delete('shared1').
        then(() => _entities2.default.get({ sharedId: 'shared1' })).
        then(response => {
          expect(response.length).toBe(0);
          done();
        }).
        catch((0, _jasmineHelpers.catchErrors)(done));
      });
    });

    describe('when database deletion throws an error', () => {
      it('should reindex the documents', done => {
        spyOn(_entitiesModel.default, 'delete').and.callFake(() => Promise.reject('error'));
        spyOn(_entities2.default, 'indexEntities').and.returnValue(Promise.resolve());

        _entities2.default.delete('shared').
        catch(() => {
          expect(_entities2.default.indexEntities).toHaveBeenCalledWith({ sharedId: 'shared' }, '+fullText');
          done();
        });
      });
    });

    describe('getRawePage', () => {
      it('should return the page text', async () => {
        const pageNumber = 2;
        const page = await _entities2.default.getRawPage('shared', 'en', pageNumber);

        expect(page).toBe('page 2');
      });

      describe('when entity do not exists', () => {
        it('should throw 404 error', async () => {
          const pageNumber = 2;
          try {
            await _entities2.default.getRawPage('nonexistent', 'en', pageNumber);
          } catch (e) {
            expect(e.code).toBe(404);
          }
        });
      });

      describe('when page is blank', () => {
        it('should not throw a 404', async () => {
          const pageNumber = 3;
          const page = await _entities2.default.getRawPage('shared', 'en', pageNumber);

          expect(page).toBe('');
        });
      });
      describe('when page do not exists', () => {
        it('should throw 404 error', async () => {
          const pageNumber = 200;
          try {
            await _entities2.default.getRawPage('shared', 'en', pageNumber);
          } catch (e) {
            expect(e.code).toBe(404);
          }
        });
      });
    });

    it('should delete the document in the database', done => {
      _entities2.default.delete('shared').
      then(() => _entities2.default.get({ sharedId: 'shared' })).
      then(response => {
        expect(response.length).toBe(0);
        done();
      }).
      catch((0, _jasmineHelpers.catchErrors)(done));
    });

    it('should delete the document from the search', done => _entities2.default.delete('shared').
    then(() => {
      const argumnets = _search.default.delete.calls.allArgs();
      expect(_search.default.delete).toHaveBeenCalled();
      expect(argumnets[0][0]._id.toString()).toBe(_fixtures.batmanFinishesId.toString());
      done();
    }).
    catch((0, _jasmineHelpers.catchErrors)(done)));

    it('should delete the document relationships', done => _entities2.default.delete('shared').
    then(() => _relationships.default.get({ entity: 'shared' })).
    then(refs => {
      expect(refs.length).toBe(0);
      done();
    }).
    catch((0, _jasmineHelpers.catchErrors)(done)));

    it('should delete the original file', async () => {
      _fs.default.writeFileSync(_path.default.join(_paths.default.uploadedDocuments, '8202c463d6158af8065022d9b5014ccb.pdf'));
      _fs.default.writeFileSync(_path.default.join(_paths.default.uploadedDocuments, '8202c463d6158af8065022d9b5014cc1.pdf'));
      _fs.default.writeFileSync(_path.default.join(_paths.default.uploadedDocuments, '8202c463d6158af8065022d9b5014ccc.pdf'));
      _fs.default.writeFileSync(_path.default.join(_paths.default.uploadedDocuments, `${_fixtures.docId1}.jpg`));
      _fs.default.writeFileSync(_path.default.join(_paths.default.uploadedDocuments, `${_fixtures.docId2}.jpg`));

      expect(_fs.default.existsSync(_path.default.join(_paths.default.uploadedDocuments, '8202c463d6158af8065022d9b5014ccb.pdf'))).toBe(true);
      expect(_fs.default.existsSync(_path.default.join(_paths.default.uploadedDocuments, '8202c463d6158af8065022d9b5014cc1.pdf'))).toBe(true);
      expect(_fs.default.existsSync(_path.default.join(_paths.default.uploadedDocuments, '8202c463d6158af8065022d9b5014ccc.pdf'))).toBe(true);
      expect(_fs.default.existsSync(_path.default.join(_paths.default.uploadedDocuments, `${_fixtures.docId1}.jpg`))).toBe(true);
      expect(_fs.default.existsSync(_path.default.join(_paths.default.uploadedDocuments, `${_fixtures.docId2}.jpg`))).toBe(true);

      await _entities2.default.delete('shared');
      expect(_fs.default.existsSync(_path.default.join(_paths.default.uploadedDocuments, '8202c463d6158af8065022d9b5014ccb.pdf'))).toBe(false);
      expect(_fs.default.existsSync(_path.default.join(_paths.default.uploadedDocuments, '8202c463d6158af8065022d9b5014cc1.pdf'))).toBe(false);
      expect(_fs.default.existsSync(_path.default.join(_paths.default.uploadedDocuments, '8202c463d6158af8065022d9b5014ccc.pdf'))).toBe(false);
      expect(_fs.default.existsSync(_path.default.join(_paths.default.uploadedDocuments, `${_fixtures.docId1}.jpg`))).toBe(false);
      expect(_fs.default.existsSync(_path.default.join(_paths.default.uploadedDocuments, `${_fixtures.docId2}.jpg`))).toBe(false);
    });

    describe('when entity is being used as thesauri', () => {
      it('should delete the entity id on all entities using it from select/multiselect values', done => {
        _entities2.default.delete('shared').
        then(() => {
          const documentsToIndex = _search.default.bulkIndex.calls.argsFor(0)[0];
          expect(documentsToIndex[0].metadata.multiselect).toEqual(['value1']);
          expect(documentsToIndex[1].metadata.multiselect2).toEqual(['value2']);
          expect(documentsToIndex[2].metadata.select).toBe('');
          expect(documentsToIndex[3].metadata.select2).toBe('');
          done();
        }).
        catch((0, _jasmineHelpers.catchErrors)(done));
      });

      describe('when there is no multiselects but there is selects', () => {
        it('should only delete selects and not throw an error', async () => {
          await _entities2.default.delete('shared10');
          const documentsToIndex = _search.default.bulkIndex.calls.argsFor(0)[0];
          expect(documentsToIndex[0].metadata.select).toBe('');
        });
      });

      describe('when there is no selects but there is multiselects', () => {
        it('should only delete multiselects and not throw an error', done => {
          _entities2.default.delete('multiselect').
          then(() => {
            const documentsToIndex = _search.default.bulkIndex.calls.argsFor(0)[0];
            expect(documentsToIndex[0].metadata.multiselect).toEqual(['value1']);
            done();
          }).
          catch((0, _jasmineHelpers.catchErrors)(done));
        });
      });
    });
  });

  describe('deleteMultiple()', () => {
    it('should delete() all the given entities', done => {
      spyOn(_entities2.default, 'delete').and.returnValue(Promise.resolve());
      _entities2.default.deleteMultiple(['id1', 'id2']).
      then(() => {
        expect(_entities2.default.delete).toHaveBeenCalledWith('id1', false);
        expect(_entities2.default.delete).toHaveBeenCalledWith('id2', false);
        done();
      }).
      catch((0, _jasmineHelpers.catchErrors)(done));
    });
  });

  describe('addLanguage()', () => {
    it('should duplicate all the entities from the default language to the new one', async () => {
      spyOn(_entities2.default, 'createThumbnail').and.callFake(entity => {
        if (!entity.file) {
          return Promise.reject(new Error('entities without file should not try to create thumbnail'));
        }
        return Promise.resolve();
      });

      await _entities2.default.saveMultiple([{ _id: _fixtures.docId1, file: {} }]);
      await _entities2.default.addLanguage('ab', 2);
      const newEntities = await _entities2.default.get({ language: 'ab' }, '+fullText');

      expect(_entities2.default.createThumbnail.calls.count()).toBe(6);
      expect(newEntities[0].fullText).toEqual({ 1: 'text' });
      expect(newEntities.length).toBe(7);
    });
  });

  describe('removeLanguage()', () => {
    it('should delete all entities from the language', async () => {
      spyOn(_search.default, 'deleteLanguage');
      spyOn(_entities2.default, 'createThumbnail').and.returnValue(Promise.resolve());
      await _entities2.default.addLanguage('ab');
      await _entities2.default.removeLanguage('ab');
      const newEntities = await _entities2.default.get({ language: 'ab' });

      expect(_search.default.deleteLanguage).toHaveBeenCalledWith('ab');
      expect(newEntities.length).toBe(0);
    });
  });
});