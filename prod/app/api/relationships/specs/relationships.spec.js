"use strict";
var _jasmineHelpers = require("../../utils/jasmineHelpers");
var _testing_db = _interopRequireDefault(require("../../utils/testing_db"));
var _entities = _interopRequireDefault(require("../../entities/entities"));
var _errorLog = _interopRequireDefault(require("../../log/errorLog"));

var _fixtures = _interopRequireWildcard(require("./fixtures"));























var _relationships = _interopRequireDefault(require("../relationships"));
var _search = _interopRequireDefault(require("../../search/search"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function ownKeys(object, enumerableOnly) {var keys = Object.keys(object);if (Object.getOwnPropertySymbols) {keys.push.apply(keys, Object.getOwnPropertySymbols(object));}if (enumerableOnly) keys = keys.filter(function (sym) {return Object.getOwnPropertyDescriptor(object, sym).enumerable;});return keys;}function _objectSpread(target) {for (var i = 1; i < arguments.length; i++) {if (i % 2) {var source = arguments[i] != null ? arguments[i] : {};ownKeys(source, true).forEach(function (key) {_defineProperty(target, key, source[key]);});} else if (Object.getOwnPropertyDescriptors) {Object.defineProperties(target, Object.getOwnPropertyDescriptors(arguments[i]));} else {ownKeys(source).forEach(function (key) {Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(arguments[i], key));});}}return target;}function _defineProperty(obj, key, value) {if (key in obj) {Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });} else {obj[key] = value;}return obj;}

describe('relationships', () => {
  beforeEach(done => {
    spyOn(_errorLog.default, 'error');
    spyOn(_entities.default, 'updateMetdataFromRelationships').and.returnValue(Promise.resolve());
    _testing_db.default.clearAllAndLoad(_fixtures.default).then(done).catch((0, _jasmineHelpers.catchErrors)(done));
  });

  afterAll(done => {
    _testing_db.default.disconnect().then(done);
  });

  describe('getByDocument()', () => {
    const testEntityData = (connection, testValues) => {
      Object.keys(testValues).forEach(property => {
        expect(connection.entityData[property]).toEqual(testValues[property]);
      });
    };

    it('should return all the relationships of a document', async () => {
      const result = await _relationships.default.getByDocument('entity2', 'en');
      expect(result.length).toBe(12);
      const entity1Connection = result.find(connection => connection.entity === 'entity1');
      testEntityData(entity1Connection, { title: 'entity1 title', type: 'document', creationDate: 123, template: _fixtures.template });

      const entity3Connection = result.find(connection => connection.entity === 'entity3');
      testEntityData(entity3Connection, { title: 'entity3 title', type: 'entity', published: true, creationDate: 456, template: _fixtures.template });
      expect(entity3Connection.entityData.file).toBeUndefined();
    });

    it('should exclude ghost / delted entities with error reporting', async () => {
      await _relationships.default.getByDocument('entity2', 'en');
      expect(_errorLog.default.error.calls.argsFor(0)[0]).toContain('missingEntity');
    });

    it('should return text references only for the relations that match the filename of the entity', async () => {
      const entity1EnRelationships = await _relationships.default.getByDocument('entity1', 'en');
      const entity1EsRelationships = await _relationships.default.getByDocument('entity1', 'es');
      const entity1PtRelationships = await _relationships.default.getByDocument('entity1', 'pt');

      expect(entity1EnRelationships.length).toBe(5);
      expect(entity1EnRelationships.filter(r => r.hub.toString() === _fixtures.hub1.toString()).length).toBe(2);
      expect(entity1EnRelationships.filter(r => r.hub.toString() === _fixtures.hub12.toString()).length).toBe(3);

      expect(entity1EsRelationships.length).toBe(4);
      expect(entity1EsRelationships.filter(r => r.hub.toString() === _fixtures.hub1.toString()).length).toBe(2);
      expect(entity1EsRelationships.filter(r => r.hub.toString() === _fixtures.hub12.toString()).length).toBe(2);

      expect(entity1PtRelationships.length).toBe(2);
      expect(entity1PtRelationships.filter(r => r.hub.toString() === _fixtures.hub1.toString()).length).toBe(2);
    });

    it('should set template to null if no template found', async () => {
      const relations = await _relationships.default.getByDocument('entity2', 'en');
      const relationshipWithoutTemplate = relations.find(r => r._id.equals(_fixtures.connectionID9));
      const relationshipWithTemplate = relations.find(r => r._id.equals(_fixtures.connectionID8));

      expect(relationshipWithoutTemplate.template).toBe(null);
      expect(relationshipWithTemplate.template).not.toBe(null);
    });

    it('should not return hubs that are connected only to other languages', async () => {
      const relations = await _relationships.default.getByDocument('doc2', 'es');
      expect(relations.filter(r => r.hub.equals(_fixtures.hub8)).length).toBe(0);
    });

    describe('when unpublished flag is false', () => {
      it('should not return relationships of unpublised entities', async () => {
        const result = await _relationships.default.getByDocument('entity2', 'en', false);
        expect(result.length).toBe(5);
      });
    });
  });

  describe('getGroupsByConnection()', () => {
    it('should return groups of connection types and templates of all the relationships of a document', async () => {
      const groups = await _relationships.default.getGroupsByConnection('entity2', 'en');
      const group1 = groups.find(r => r.key === _fixtures.relation1.toString());
      expect(group1.key).toBe(_fixtures.relation1.toString());
      expect(group1.connectionLabel).toBe('relation 1');
      expect(group1.context).toBe(_fixtures.relation1.toString());
      expect(group1.templates.length).toBe(1);
      expect(group1.templates[0].count).toBe(2);

      const group2 = groups.find(r => r.key === _fixtures.relation2.toString());
      expect(group2.key).toBe(_fixtures.relation2.toString());
      expect(group2.connectionLabel).toBe('relation 2');
      expect(group2.context).toBe(_fixtures.relation2.toString());
      expect(group2.templates.length).toBe(1);

      expect(group2.templates[0]._id.toString()).toBe(_fixtures.template.toString());
      expect(group2.templates[0].label).toBe('template');
    });

    it('should return groups of connection including unpublished docs if user is found', async () => {
      const groups = await _relationships.default.getGroupsByConnection('entity2', 'en', { user: 'found' });
      expect(groups.length).toBe(3);
      const group1 = groups.find(r => r.key === _fixtures.relation1.toString());
      expect(group1.key).toBe(_fixtures.relation1.toString());
      expect(group1.templates[0]._id.toString()).toBe(_fixtures.template.toString());

      const group2 = groups.find(r => r.key === _fixtures.relation2.toString());
      expect(group2.key).toBe(_fixtures.relation2.toString());
      expect(group2.templates[0].count).toBe(2);

      const group3 = groups.find(r => !r.key);
      expect(group3.key).toBe(null);
      expect(group3.templates[0].count).toBe(3);
    });

    it('should return groups of connection wihtout refs if excluded', async () => {
      const groups = await _relationships.default.getGroupsByConnection('entity2', 'en', { excludeRefs: true });
      expect(groups.length).toBe(3);
      expect(groups[0].templates[0].refs).toBeUndefined();
      expect(groups[1].templates[0].refs).toBeUndefined();
      expect(groups[2].templates[0].refs).toBeUndefined();
    });
  });

  describe('getHub()', () => {
    it('should return all the connections of the same hub', async () => {
      const relations = await _relationships.default.getHub(_fixtures.hub1, 'en');
      expect(relations.length).toBe(2);
      expect(relations[0].entity).toBe('entity1');
      expect(relations[1].entity).toBe('entity2');
    });
  });

  describe('countByRelationType()', () => {
    it('should return number of relationships using a relationType', async () => {
      const relationsCount = await _relationships.default.countByRelationType(_fixtures.relation2.toString());
      expect(relationsCount).toBe(6);
    });

    it('should return zero when none is using it', async () => {
      const notUsedRelation = _testing_db.default.id().toString();
      const relationsCount = await _relationships.default.countByRelationType(notUsedRelation);
      expect(relationsCount).toBe(0);
    });
  });

  describe('bulk()', () => {
    const cleanSnapshot = _value => {
      const [[_savedItem], ...deletes] = _value;
      const savedItem = _objectSpread({},
      _savedItem, {
        _id: _savedItem._id.equals(_fixtures.connectionID5) ? 'connectionID5' : _savedItem._id,
        template: _savedItem.template.equals(_fixtures.relation2) ? 'relation2' : _savedItem.relation2,
        hub: _savedItem.hub.equals(_fixtures.hub2) ? 'hub2' : _savedItem.hub2 });


      savedItem.entityData = _objectSpread({},
      savedItem.entityData, {
        _id: savedItem.entityData._id.equals(_fixtures.entity3) ? 'entity3' : savedItem.entityData._id,
        template: savedItem.entityData.template.equals(_fixtures.template) ? 'template' : savedItem.entityData.template });


      return [[savedItem], ...deletes];
    };

    it('should save or delete the relationships', async () => {
      const data = {
        save: [{ _id: _fixtures.connectionID5, entity: 'entity3', hub: _fixtures.hub2, template: _fixtures.relation2, range: { text: 'changed text' } }],
        delete: [{ _id: _fixtures.connectionID2 }, { _id: _fixtures.connectionID3 }] };


      const response = await _relationships.default.bulk(data, 'en');
      expect(cleanSnapshot(response)).toMatchSnapshot();

      const savedReference = await _relationships.default.getById(_fixtures.connectionID5);
      expect(savedReference.range.text).toBe('changed text');

      const deletedReference2 = await _relationships.default.getById(_fixtures.connectionID2);
      expect(deletedReference2).toBe(null);
      const deletedReference3 = await _relationships.default.getById(_fixtures.connectionID3);
      expect(deletedReference3).toBe(null);
    });

    it('should first save and then delete to prevent sidefects of hub sanitizing', async () => {
      const data = {
        save: [{ entity: 'entity3', hub: _fixtures.hub11 }],
        delete: [{ _id: _fixtures.connectionID6 }] };


      await _relationships.default.bulk(data, 'en');
      const hubRelationships = await _relationships.default.getHub(_fixtures.hub11);
      expect(hubRelationships.length).toBe(2);
    });
  });

  describe('save()', () => {
    describe('When creating a new reference to a hub', () => {
      it('should save it and return it with the entity data', async () => {
        const [result] = await _relationships.default.save({ entity: 'entity3', hub: _fixtures.hub1 }, 'en');

        expect(result.entity).toBe('entity3');
        expect(result.entityData.template).toEqual(_fixtures.template);
        expect(result.entityData.type).toBe('entity');
        expect(result.entityData.title).toBe('entity3 title');
        expect(result.entityData.published).toBe(true);
        expect(result._id).toBeDefined();
      });

      it('should call entities to update the metadata', async () => {
        await _relationships.default.save({ entity: 'entity3', hub: _fixtures.hub1 }, 'en');
        expect(_entities.default.updateMetdataFromRelationships).toHaveBeenCalledWith(['entity1', 'entity2', 'entity3'], 'en');
      });
    });

    describe('when creating relationships to non existent entities', () => {
      it('should not create them', async () => {
        const relations = await _relationships.default.save([{ entity: 'non existent' }, { entity: 'entity3' }, { entity: 'doc4' }], 'en');
        expect(relations.length).toBe(2);

        const [entity3Connection, doc4Connection] = relations;
        expect(entity3Connection.entity).toBe('entity3');
        expect(doc4Connection.entity).toBe('doc4');
      });

      it('should not throw an error on 0 length relations', async () => {
        const relations = await _relationships.default.save([{ entity: 'non existent' }], 'en');
        expect(relations.length).toBe(0);
      });
    });

    describe('When creating new relationships', () => {
      it('should assign them a hub and return them with the entity data', async () => {
        const [entity3Connection, doc4Connection] = await _relationships.default.save([{ entity: 'entity3' }, { entity: 'doc4' }], 'en');

        expect(entity3Connection.entity).toBe('entity3');
        expect(entity3Connection.entityData.template).toEqual(_fixtures.template);
        expect(entity3Connection.entityData.type).toBe('entity');
        expect(entity3Connection.entityData.title).toBe('entity3 title');
        expect(entity3Connection.entityData.published).toBe(true);

        expect(entity3Connection._id).toBeDefined();
        expect(entity3Connection.hub).toBeDefined();

        expect(doc4Connection.entity).toBe('doc4');
        expect(doc4Connection.entityData.template).toEqual(_fixtures.template);
        expect(doc4Connection.entityData.type).toBe('document');
        expect(doc4Connection.entityData.title).toBe('doc4 en title');
        expect(doc4Connection.entityData.published).not.toBeDefined();

        expect(doc4Connection._id).toBeDefined();
        expect(doc4Connection.hub).toBeDefined();
        expect(doc4Connection.hub.toString()).toBe(entity3Connection.hub.toString());
      });

      describe('when creating text references', () => {
        it('should assign them the file they belong to', async () => {
          const saveResult = await _relationships.default.save([
          { entity: 'doc5', range: { text: 'one thing' } },
          { entity: 'doc4', range: { text: 'something' } }],
          'es');

          expect(saveResult.length).toBe(2);
          expect(saveResult[0].filename).toBe('doc5enFile');
          expect(saveResult[1].filename).toBe('doc4enFile');
        });
      });
    });

    describe('when the reference exists', () => {
      it('should update it', async () => {
        const reference = await _relationships.default.getById(_fixtures.connectionID1);
        reference.entity = 'entity1';
        await _relationships.default.save(reference, 'en');

        const changedReference = await _relationships.default.getById(_fixtures.connectionID1);

        expect(changedReference.entity).toBe('entity1');
        expect(changedReference._id.equals(_fixtures.connectionID1)).toBe(true);
      });

      it('should update correctly if ID is not a mongo ObjectId', async () => {
        const reference = await _relationships.default.getById(_fixtures.connectionID1);
        reference._id = reference._id.toString();
        reference.entity = 'entity1';

        const [changedReference] = await _relationships.default.save(reference, 'en');

        expect(changedReference.entity).toBe('entity1');
        expect(changedReference._id.equals(_fixtures.connectionID1)).toBe(true);
      });

      it('should update correctly if template is null', async () => {
        const reference = await _relationships.default.getById(_fixtures.connectionID1);
        reference.template = { _id: null };
        const [savedReference] = await _relationships.default.save(reference, 'en');
        expect(savedReference.entity).toBe('entity_id');
        expect(savedReference.template).toBe(null);
      });
    });

    describe('when saving one reference without hub', () => {
      it('should throw an error', done => {
        _relationships.default.save({ entity: 'entity3', range: { text: 'range' } }, 'en').
        then(() => {
          done.fail('Should throw an error');
        }).
        catch(error => {
          expect(error.code).toBe(500);
          done();
        });
      });
    });
  });

  describe('saveEntityBasedReferences()', () => {
    let entity;

    beforeEach(() => {
      entity = {
        template: _fixtures.template.toString(),
        sharedId: 'bruceWayne',
        metadata: { family: ['thomasWayne'], friend: ['robin', 'alfred'] } };

    });

    const saveReferencesChangingMetadataTo = async metadata => {
      entity.metadata = metadata;
      await _relationships.default.saveEntityBasedReferences(entity, 'en');
    };

    it('should create connections based on properties', async () => {
      await saveReferencesChangingMetadataTo({ friend: ['robin'] });
      const connections = await _relationships.default.getByDocument('bruceWayne', 'en');
      expect(connections.find(connection => connection.entity === 'bruceWayne')).toBeDefined();
      expect(connections.find(connection => connection.entity === 'robin')).toBeDefined();
      expect(connections[0].hub).toEqual(connections[1].hub);
    });

    it('should not fail on missing metadata', async () => {
      await saveReferencesChangingMetadataTo(undefined);
      const connections = await _relationships.default.getByDocument('bruceWayne', 'en');
      expect(connections.find(connection => connection.entity === 'bruceWayne')).toBeDefined();
      expect(connections[0].hub).toEqual(connections[1].hub);
    });

    it('should not create existing connections based on properties', async () => {
      await _relationships.default.saveEntityBasedReferences(entity, 'en');
      await _relationships.default.saveEntityBasedReferences(entity, 'en');
      const connections = await _relationships.default.getByDocument('bruceWayne', 'en');

      const existingHubConnections = connections.filter(c => c.hub.equals(_fixtures.hub9));
      const newHubCreated = connections.filter(c => !c.hub.equals(_fixtures.hub9));

      expect(existingHubConnections.length).toBe(4);

      expect(newHubCreated.length).toBe(3);
      expect(newHubCreated.find(c => c.entity === 'robin').template.toString()).toBe(_fixtures.friend.toString());
      expect(newHubCreated.find(c => c.entity === 'alfred').template.toString()).toBe(_fixtures.friend.toString());
      expect(newHubCreated.find(c => c.entity === 'bruceWayne').template).toBe(null);
    });

    it('should delete connections based on properties', async () => {
      await _relationships.default.saveEntityBasedReferences(entity, 'en');

      await saveReferencesChangingMetadataTo({ family: ['thomasWayne'], friend: ['alfred'] });
      let connections = await _relationships.default.getByDocument('bruceWayne', 'en');
      expect(connections.length).toBe(6);
      expect(connections.find(c => c.entity === 'robin')).not.toBeDefined();

      await saveReferencesChangingMetadataTo({ family: ['alfred'], friend: ['robin'] });
      connections = await _relationships.default.getByDocument('bruceWayne', 'en');

      expect(connections.find(c => c.entity === 'thomasWayne')).not.toBeDefined();
      expect(connections.find(c => c.entity === 'alfred').template.toString()).toBe(_fixtures.family.toString());
      expect(connections.length).toBe(7);
    });
  });

  describe('search()', () => {
    it('should prepare a query with ids based on an entity id and a searchTerm', async () => {
      const searchResponse = Promise.resolve({ rows: [] });
      spyOn(_search.default, 'search').and.returnValue(searchResponse);
      await _relationships.default.search('entity2', { filter: {}, searchTerm: 'something' }, 'en');
      const actualQuery = _search.default.search.calls.mostRecent().args[0];
      expect(actualQuery.searchTerm).toEqual('something');
      expect(actualQuery.ids).containItems(['doc5', 'doc4', 'entity3', 'entity1']);
      expect(actualQuery.includeUnpublished).toBe(true);
      expect(actualQuery.limit).toBe(9999);
    });

    it('should filter out ids based on filtered relation types and templates, and pass the user to search', async () => {
      const searchResponse = Promise.resolve({ rows: [] });
      spyOn(_search.default, 'search').and.returnValue(searchResponse);
      const query = { filter: {}, searchTerm: 'something' };
      query.filter[_fixtures.relation2] = [_fixtures.relation2 + _fixtures.template];

      await _relationships.default.search('entity2', query, 'en', 'user');

      const actualQuery = _search.default.search.calls.mostRecent().args[0];
      const language = _search.default.search.calls.mostRecent().args[1];
      const user = _search.default.search.calls.mostRecent().args[2];

      expect(actualQuery.searchTerm).toEqual('something');
      expect(actualQuery.ids).containItems(['doc4', 'entity3']);
      expect(actualQuery.includeUnpublished).toBe(true);
      expect(actualQuery.limit).toBe(9999);

      expect(language).toBe('en');
      expect(user).toBe('user');
    });

    it('should return the matching entities with their relationships and the current entity with the respective relationships', async () => {
      const searchResponse = Promise.resolve(
      { rows: [
        { sharedId: 'entity1' },
        { sharedId: 'entity3' },
        { sharedId: 'doc4' },
        { sharedId: 'doc5' }] });


      spyOn(_search.default, 'search').and.returnValue(searchResponse);
      const result = await _relationships.default.search('entity2', { filter: {}, searchTerm: 'something' }, 'en');
      expect(result.rows.length).toBe(5);
      expect(result.rows[0].connections.length).toBe(1);
      expect(result.rows[1].connections.length).toBe(4);
      expect(result.rows[2].connections.length).toBe(1);
      expect(result.rows[3].connections.length).toBe(1);
      expect(result.rows[4].connections.length).toBe(5);
    });

    it('should return number of hubs (total and requested) and allow limiting the number of HUBs returned', async () => {
      const searchResponse = Promise.resolve(
      { rows: [
        { sharedId: 'entity1' },
        { sharedId: 'entity3' },
        { sharedId: 'doc4' },
        { sharedId: 'doc5' }] });

      spyOn(_search.default, 'search').and.returnValue(searchResponse);

      const result = await _relationships.default.search('entity2', { filter: {}, searchTerm: 'something', limit: 2 }, 'en');
      expect(result.totalHubs).toBe(5);
      expect(result.requestedHubs).toBe(2);

      const expectedHubIds = result.rows[result.rows.length - 1].connections.map(c => c.hub.toString());
      expect(expectedHubIds.length).toBe(2);
      expect(expectedHubIds).toContain(result.rows[0].connections[0].hub.toString());
      expect(expectedHubIds).toContain(result.rows[1].connections[0].hub.toString());
      expect(expectedHubIds).toContain(result.rows[1].connections[1].hub.toString());

      expect(result.rows[0].sharedId).toBe('entity1');
      expect(result.rows[0].connections.length).toBe(1);

      expect(result.rows[1].sharedId).toBe('entity3');
      expect(result.rows[1].connections.length).toBe(2);

      expect(result.rows[2].sharedId).toBe('entity2');
      expect(result.rows[2].connections.length).toBe(2);
    });
  });

  describe('delete()', () => {
    it('should delete the relationship', async () => {
      const response = await _relationships.default.delete({ _id: _fixtures.connectionID1 }, 'en');
      const hub7Connections = await _relationships.default.get({ hub: _fixtures.hub7 });
      expect(hub7Connections.filter(c => c._id.toString() === _fixtures.connectionID1.toString()).length).toBe(0);
      expect(response.ok).toBe(1);
    });

    it('should not leave a lone connection in the hub', async () => {
      await _relationships.default.delete({ _id: _fixtures.connectionID1 }, 'en');
      await _relationships.default.delete({ _id: _fixtures.connectionID3 }, 'en');
      await _relationships.default.delete({ _id: _fixtures.connectionID2 }, 'en');

      const hubRelationships = await _relationships.default.get({ hub: _fixtures.hub7 });

      expect(hubRelationships).toEqual([]);
    });

    describe('when deleting relations for an entity', () => {
      it('should not leave single relationship hubs', async () => {
        await _relationships.default.delete({ entity: 'entity3' }, 'en');

        const hub2Relationships = await _relationships.default.get({ hub: _fixtures.hub2 });
        const hub11Relationships = await _relationships.default.get({ hub: _fixtures.hub11 });

        expect(hub2Relationships).toEqual([]);
        expect(hub11Relationships).toEqual([]);
      });
    });

    it('should not delete the hub when specific combos yield a hub with less than 2 connections', async () => {
      await _relationships.default.delete({ _id: _fixtures.connectionID4 }, 'es');

      const hubRelationships = await _relationships.default.get({ hub: _fixtures.hub12 });

      expect(hubRelationships.length).toBe(2);
      expect(hubRelationships.filter(c => c.entity === 'entity1').length).toBe(1);
      expect(hubRelationships.filter(c => c.entity === 'doc2').length).toBe(1);
    });

    it('should call entities to update the metadata', async () => {
      await _relationships.default.delete({ entity: 'bruceWayne' }, 'en');

      expect(_entities.default.updateMetdataFromRelationships).toHaveBeenCalledWith(['doc2', 'IHaveNoTemplate', 'thomasWayne', 'bruceWayne'], 'en');
      expect(_entities.default.updateMetdataFromRelationships).toHaveBeenCalledWith(['doc2', 'IHaveNoTemplate', 'thomasWayne', 'bruceWayne'], 'es');
    });

    describe('when there is no condition', () => {
      it('should throw an error', done => {
        _relationships.default.delete().
        then(() => {
          done.fail('Should throw an error');
        }).
        catch(error => {
          expect(error.code).toBe(500);
          done();
        });
      });
    });
  });

  describe('deleteTextReferences()', () => {
    it('should delete the entity text relationships (that match language)', async () => {
      await _relationships.default.deleteTextReferences('doc2', 'en');

      const [relationshipsInEnglish, relationshipsInPT] = await Promise.all([
      _relationships.default.getByDocument('doc2', 'en'),
      _relationships.default.getByDocument('doc2', 'pt')]);


      expect(relationshipsInEnglish.length).toBe(4);
      expect(relationshipsInPT.length).toBe(8);
    });

    it('should not delete text relationships if filename also used in other languages', async () => {
      await _relationships.default.deleteTextReferences('doc5', 'en');
      const doc5Relationships = await _relationships.default.get({ entity: 'doc5', hub: _fixtures.hub5 });
      expect(doc5Relationships.length).toBe(1);
    });

    it('should not leave a lone connection in the hub', async () => {
      await _relationships.default.delete({ entity: 'entity_id' }, 'en');
      await _relationships.default.deleteTextReferences('doc2', 'en');
      await _relationships.default.deleteTextReferences('doc2', 'pt');

      const hubRelationships = await _relationships.default.get({ hub: _fixtures.hub8 });

      expect(hubRelationships).toEqual([]);
    });

    it('should not delete any relationships if entity.file.filename if undefined', async () => {
      await _relationships.default.deleteTextReferences('entity1', 'en');
      const hubRelationships = await _relationships.default.getByDocument('entity1', 'en');
      expect(hubRelationships.length).toEqual(5);
    });
  });
});