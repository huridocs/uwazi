/* eslint-disable max-lines */
/* eslint-disable max-statements */
/* eslint-disable max-nested-callbacks */

import db from 'api/utils/testing_db';
import entities from 'api/entities/entities';

import { UserInContextMockFactory } from 'api/utils/testingUserInContext';
import fixtures, {
  connectionID1,
  connectionID2,
  connectionID3,
  connectionID4,
  connectionID5,
  connectionID6,
  connectionID8,
  connectionID9,
  entity3,
  hub1,
  hub2,
  hub5,
  hub7,
  hub8,
  hub9,
  hub11,
  hub12,
  friend,
  family,
  relation1,
  relation2,
  template,
} from './fixtures';
import relationships from '../relationships';
import { search } from '../../search';

describe('relationships', () => {
  beforeEach(async () => {
    jest.resetAllMocks();
    jest
      .spyOn(entities, 'updateMetdataFromRelationships')
      .mockImplementation(async () => Promise.resolve());
    await db.setupFixturesAndContext(fixtures);
  });

  afterAll(async () => {
    await db.disconnect();
  });

  describe('getByDocument()', () => {
    const testEntityData = (connection, testValues) => {
      Object.keys(testValues).forEach(property => {
        expect(connection.entityData[property]).toEqual(testValues[property]);
      });
    };

    it('should return all the relationships of a document', async () => {
      const userFactory = new UserInContextMockFactory();
      userFactory.mock({
        _id: 'user1',
        role: 'collaborator',
        groups: [],
      });
      const result = await relationships.getByDocument('entity2', 'en');
      expect(result.length).toBe(12);
      const entity1Connection = result.find(connection => connection.entity === 'entity1');
      testEntityData(entity1Connection, {
        title: 'entity1 title',
        type: 'document',
        creationDate: 123,
        template,
      });

      const entity3Connection = result.find(connection => connection.entity === 'entity3');
      testEntityData(entity3Connection, {
        title: 'entity3 title',
        type: 'entity',
        published: true,
        creationDate: 456,
        template,
      });
      expect(entity3Connection.entityData.file).toBeUndefined();
    });

    it('should return all the relationships of an entity for a specific file', async () => {
      const result = await relationships.getByDocument('entity2', 'en', true, 'file2');

      expect(result.map(e => e.file).includes('file2')).toBe(true);
      expect(result.map(e => e.file).includes('file1')).toBe(false);
    });

    it('should exclude ghost / deleted / restricted entities', async () => {
      const result = await relationships.getByDocument('entity2', 'en');
      expect(result.find(r => r.entity === 'missingEntity')).toBeUndefined();
    });

    it('should return text references only for the relations that match the filename of the entity', async () => {
      const entity1EnRelationships = await relationships.getByDocument('entity1', 'en');
      const entity1EsRelationships = await relationships.getByDocument('entity1', 'es');
      const entity1PtRelationships = await relationships.getByDocument('entity1', 'pt');

      expect(entity1EnRelationships.length).toBe(5);
      expect(entity1EnRelationships.filter(r => r.hub.toString() === hub1.toString()).length).toBe(
        2
      );
      expect(entity1EnRelationships.filter(r => r.hub.toString() === hub12.toString()).length).toBe(
        3
      );

      expect(entity1EsRelationships.length).toBe(4);
      expect(entity1EsRelationships.filter(r => r.hub.toString() === hub1.toString()).length).toBe(
        2
      );
      expect(entity1EsRelationships.filter(r => r.hub.toString() === hub12.toString()).length).toBe(
        2
      );

      expect(entity1PtRelationships.length).toBe(2);
      expect(entity1PtRelationships.filter(r => r.hub.toString() === hub1.toString()).length).toBe(
        2
      );
    });

    it('should set template to null if no template found', async () => {
      const relations = await relationships.getByDocument('entity2', 'en');
      const relationshipWithoutTemplate = relations.find(r => r._id.equals(connectionID9));
      const relationshipWithTemplate = relations.find(r => r._id.equals(connectionID8));

      expect(relationshipWithoutTemplate.template).toBe(null);
      expect(relationshipWithTemplate.template).not.toBe(null);
    });

    it('should not return hubs that are connected only to other languages', async () => {
      const relations = await relationships.getByDocument('doc2', 'es');
      expect(relations.filter(r => r.hub.equals(hub8)).length).toBe(0);
    });

    describe('when unpublished flag is false', () => {
      it('should not return relationships of unpublised entities', async () => {
        const result = await relationships.getByDocument('entity2', 'en', false);
        expect(result.length).toBe(5);
      });
    });
  });

  describe('getGroupsByConnection()', () => {
    it('should return groups of connection types and templates of all the relationships of a document', async () => {
      const groups = await relationships.getGroupsByConnection('entity2', 'en');
      const group1 = groups.find(r => r.key === relation1.toString());
      expect(group1.key).toBe(relation1.toString());
      expect(group1.connectionLabel).toBe('relation 1');
      expect(group1.context).toBe(relation1.toString());
      expect(group1.templates.length).toBe(1);
      expect(group1.templates[0].count).toBe(2);

      const group2 = groups.find(r => r.key === relation2.toString());
      expect(group2.key).toBe(relation2.toString());
      expect(group2.connectionLabel).toBe('relation 2');
      expect(group2.context).toBe(relation2.toString());
      expect(group2.templates.length).toBe(1);

      expect(group2.templates[0]._id.toString()).toBe(template.toString());
      expect(group2.templates[0].label).toBe('template');
    });

    it('should return groups of connection including unpublished docs if user is found', async () => {
      const groups = await relationships.getGroupsByConnection('entity2', 'en', { user: 'found' });
      expect(groups.length).toBe(3);
      const group1 = groups.find(r => r.key === relation1.toString());
      expect(group1.key).toBe(relation1.toString());
      expect(group1.templates[0]._id.toString()).toBe(template.toString());

      const group2 = groups.find(r => r.key === relation2.toString());
      expect(group2.key).toBe(relation2.toString());
      expect(group2.templates[0].count).toBe(2);

      const group3 = groups.find(r => !r.key);
      expect(group3.key).toBe(null);
      expect(group3.templates[0].count).toBe(3);
    });

    it('should return groups of connection wihtout refs if excluded', async () => {
      const groups = await relationships.getGroupsByConnection('entity2', 'en', {
        excludeRefs: true,
      });
      expect(groups.length).toBe(3);
      expect(groups[0].templates[0].refs).toBeUndefined();
      expect(groups[1].templates[0].refs).toBeUndefined();
      expect(groups[2].templates[0].refs).toBeUndefined();
    });
  });

  describe('getHub()', () => {
    it('should return all the connections of the same hub', async () => {
      const relations = await relationships.getHub(hub1, 'en');
      expect(relations.length).toBe(2);
      expect(relations[0].entity).toBe('entity1');
      expect(relations[1].entity).toBe('entity2');
    });
  });

  describe('countByRelationType()', () => {
    it('should return number of relationships using a relationType', async () => {
      const relationsCount = await relationships.countByRelationType(relation2.toString());
      expect(relationsCount).toBe(6);
    });

    it('should return zero when none is using it', async () => {
      const notUsedRelation = db.id().toString();
      const relationsCount = await relationships.countByRelationType(notUsedRelation);
      expect(relationsCount).toBe(0);
    });
  });

  describe('bulk()', () => {
    const cleanSnapshot = _value => {
      const { saves, deletions } = _value;
      const [_savedItem] = saves;
      const savedItem = {
        ..._savedItem,
        _id: _savedItem._id.equals(connectionID5) ? 'connectionID5' : _savedItem._id,
        template: _savedItem.template.equals(relation2) ? 'relation2' : _savedItem.relation2,
        hub: _savedItem.hub.equals(hub2) ? 'hub2' : _savedItem.hub2,
        reference: { text: _savedItem.reference.text },
      };

      savedItem.entityData = {
        ...savedItem.entityData,
        _id: savedItem.entityData._id.equals(entity3) ? 'entity3' : savedItem.entityData._id,
        template: savedItem.entityData.template.equals(template)
          ? 'template'
          : savedItem.entityData.template,
      };

      delete deletions.$clusterTime;
      delete deletions.opTime;
      delete deletions.operationTime;
      delete deletions.electionId;

      return [[savedItem], deletions];
    };

    it('should save or delete the relationships', async () => {
      const data = {
        save: [
          {
            _id: connectionID5,
            entity: 'entity3',
            hub: hub2,
            template: relation2,
            reference: {
              text: 'changed text',
              selectionRectangles: [{ width: 1, height: 1, top: 1, left: 1, page: '1' }],
            },
          },
        ],
        delete: [{ _id: connectionID2 }, { _id: connectionID3 }],
      };

      const response = await relationships.bulk(data, 'en');
      expect(cleanSnapshot(response)).toMatchSnapshot();

      const savedReference = await relationships.getById(connectionID5);
      expect(savedReference.reference.text).toBe('changed text');

      const deletedReference2 = await relationships.getById(connectionID2);
      expect(deletedReference2).toBe(null);
      const deletedReference3 = await relationships.getById(connectionID3);
      expect(deletedReference3).toBe(null);
    });

    it('should first save and then delete to prevent sidefects of hub sanitizing', async () => {
      const data = {
        save: [{ entity: 'entity3', hub: hub11 }],
        delete: [{ _id: connectionID6 }],
      };

      await relationships.bulk(data, 'en');
      const hubRelationships = await relationships.getHub(hub11);
      expect(hubRelationships.length).toBe(2);
    });
  });

  describe('save()', () => {
    describe('When creating a new reference to a hub', () => {
      it('should save it and return it with the entity data', async () => {
        const [result] = await relationships.save({ entity: 'entity3', hub: hub1 }, 'en');

        expect(result.entity).toBe('entity3');
        expect(result.entityData.template).toEqual(template);
        expect(result.entityData.type).toBe('entity');
        expect(result.entityData.title).toBe('entity3 title');
        expect(result.entityData.published).toBe(true);
        expect(result._id).toBeDefined();
      });

      it('should call entities to update the metadata', async () => {
        await relationships.save({ entity: 'entity3', hub: hub1 }, 'en');
        expect(entities.updateMetdataFromRelationships).toHaveBeenCalledWith(
          ['entity1', 'entity2', 'entity3'],
          'en'
        );
      });
    });

    describe('when creating relationships to non existent entities', () => {
      it('should not create them', async () => {
        const relations = await relationships.save(
          [{ entity: 'non existent' }, { entity: 'entity3' }, { entity: 'doc4' }],
          'en'
        );
        expect(relations.length).toBe(2);

        const [entity3Connection, doc4Connection] = relations;
        expect(entity3Connection.entity).toBe('entity3');
        expect(doc4Connection.entity).toBe('doc4');
      });

      it('should not throw an error on 0 length relations', async () => {
        const relations = await relationships.save([{ entity: 'non existent' }], 'en');
        expect(relations.length).toBe(0);
      });
    });

    describe('When creating new relationships', () => {
      it('should assign them a hub and return them with the entity data', async () => {
        const [entity3Connection, doc4Connection] = await relationships.save(
          [{ entity: 'entity3' }, { entity: 'doc4' }],
          'en'
        );

        expect(entity3Connection.entity).toBe('entity3');
        expect(entity3Connection.entityData.template).toEqual(template);
        expect(entity3Connection.entityData.type).toBe('entity');
        expect(entity3Connection.entityData.title).toBe('entity3 title');
        expect(entity3Connection.entityData.published).toBe(true);

        expect(entity3Connection._id).toBeDefined();
        expect(entity3Connection.hub).toBeDefined();

        expect(doc4Connection.entity).toBe('doc4');
        expect(doc4Connection.entityData.template).toEqual(template);
        expect(doc4Connection.entityData.type).toBe('document');
        expect(doc4Connection.entityData.title).toBe('doc4 en title');
        expect(doc4Connection.entityData.published).not.toBeDefined();

        expect(doc4Connection._id).toBeDefined();
        expect(doc4Connection.hub).toBeDefined();
        expect(doc4Connection.hub.toString()).toBe(entity3Connection.hub.toString());
      });
    });

    describe('when the reference exists', () => {
      it('should update it', async () => {
        const reference = await relationships.getById(connectionID1);
        reference.entity = 'entity1';
        await relationships.save(reference, 'en');

        const changedReference = await relationships.getById(connectionID1);

        expect(changedReference.entity).toBe('entity1');
        expect(changedReference._id.equals(connectionID1)).toBe(true);
      });

      it('should update correctly if ID is not a mongo ObjectId', async () => {
        const reference = await relationships.getById(connectionID1);
        reference._id = reference._id.toString();
        reference.entity = 'entity1';

        const [changedReference] = await relationships.save(reference, 'en');

        expect(changedReference.entity).toBe('entity1');
        expect(changedReference._id.equals(connectionID1)).toBe(true);
      });

      it('should update correctly if template is null', async () => {
        const reference = await relationships.getById(connectionID1);
        reference.template = { _id: null };
        const [savedReference] = await relationships.save(reference, 'en');
        expect(savedReference.entity).toBe('entity_id');
        expect(savedReference.template).toBe(null);
      });
    });

    describe('when saving one reference without hub', () => {
      it('should throw an error', done => {
        relationships
          .save({ entity: 'entity3' }, 'en')
          .then(() => {
            done.fail('Should throw an error');
          })
          .catch(error => {
            expect(error.code).toBe(500);
            done();
          });
      });
    });

    it('should not allow mixing references with and without hubs', done => {
      relationships
        .save([{ entity: 'entity3' }, { entity: 'entity1', hub: 'somehub' }], 'en')
        .then(() => {
          done.fail('Should throw an error');
        })
        .catch(error => {
          expect(error.code).toBe(500);
          done();
        });
    });

    describe('when saving grouped input', () => {
      const entity3Expected = {
        template,
        type: 'entity',
        title: 'entity3 title',
        published: true,
      };

      const entity4Expected = {
        template,
        type: 'entity',
        title: 'entity4 title',
        published: true,
      };

      it('should save grouped input with or without existing hubs', async () => {
        const result = await relationships.save(
          [
            [
              { entity: 'entity3', hub: hub1 },
              { entity: 'entity4', hub: hub2 },
            ],
            [{ entity: 'entity3' }, { entity: 'entity4' }],
          ],
          'en'
        );
        expect(result).toMatchObject([
          {
            _id: expect.anything(),
            entity: 'entity3',
            hub: hub1,
            entityData: entity3Expected,
          },
          {
            _id: expect.anything(),
            entity: 'entity4',
            hub: hub2,
            entityData: entity4Expected,
          },
          {
            _id: expect.anything(),
            entity: 'entity3',
            hub: expect.anything(),
            entityData: entity3Expected,
          },
          {
            _id: expect.anything(),
            entity: 'entity4',
            hub: expect.anything(),
            entityData: entity4Expected,
          },
        ]);
        expect(result[2].entityData.hub).toEqual(result[3].entityData.hub);
      });

      it('should allow mixing grouped and non-grouped input', async () => {
        const result = await relationships.save(
          [
            [
              { entity: 'entity3', hub: hub1 },
              { entity: 'entity4', hub: hub1 },
            ],
            { entity: 'entity3' },
            { entity: 'entity4' },
          ],
          'en'
        );
        expect(result).toMatchObject([
          {
            _id: expect.anything(),
            entity: 'entity3',
            hub: hub1,
            entityData: entity3Expected,
          },
          {
            _id: expect.anything(),
            entity: 'entity4',
            hub: hub1,
            entityData: entity4Expected,
          },
          {
            _id: expect.anything(),
            entity: 'entity3',
            hub: expect.anything(),
            entityData: entity3Expected,
          },
          {
            _id: expect.anything(),
            entity: 'entity4',
            hub: expect.anything(),
            entityData: entity4Expected,
          },
        ]);
        expect(result[2].entityData.hub).toEqual(result[3].entityData.hub);
      });

      it('should not allow mixing references with and without hubs in each group', async () => {
        try {
          await relationships.save(
            [
              [
                { entity: 'entity3', hub: hub1 },
                { entity: 'entity4', hub: hub1 },
              ],
              [{ entity: 'entity3', hub: hub2 }, { entity: 'entity4' }],
            ],
            'en'
          );
          throw new Error('Should throw an error');
        } catch (error) {
          expect(error.code).toBe(500);
        }
      });

      it('should not allow groups of one reference without hub', async () => {
        try {
          await relationships.save(
            [
              [
                { entity: 'entity3', hub: hub1 },
                { entity: 'entity4', hub: hub1 },
              ],
              [{ entity: 'entity4' }],
            ],
            'en'
          );
          throw new Error('Should throw an error');
        } catch (error) {
          expect(error.code).toBe(500);
        }
      });
    });
  });

  describe('saveEntityBasedReferences()', () => {
    let entity;

    beforeEach(() => {
      entity = {
        template: template.toString(),
        sharedId: 'bruceWayne',
        metadata: {
          family: [{ value: 'thomasWayne' }],
          friend: [{ value: 'robin' }, { value: 'alfred' }],
        },
      };
    });

    const saveReferencesChangingMetadataTo = async metadata => {
      entity.metadata = metadata;
      await relationships.saveEntityBasedReferences(entity, 'en');
    };

    it('should create connections based on properties', async () => {
      await saveReferencesChangingMetadataTo({ friend: [{ value: 'robin' }] });
      const connections = await relationships.getByDocument('bruceWayne', 'en');
      expect(connections.find(connection => connection.entity === 'bruceWayne')).toBeDefined();
      expect(connections.find(connection => connection.entity === 'robin')).toBeDefined();
      expect(connections[0].hub).toEqual(connections[1].hub);
    });

    it('should not fail on missing metadata', async () => {
      await saveReferencesChangingMetadataTo(undefined);
      const connections = await relationships.getByDocument('bruceWayne', 'en');
      expect(connections.find(connection => connection.entity === 'bruceWayne')).toBeDefined();
      expect(connections[0].hub).toEqual(connections[1].hub);
    });

    it('should not create existing connections based on properties', async () => {
      await relationships.saveEntityBasedReferences(entity, 'en');
      await relationships.saveEntityBasedReferences(entity, 'en');
      const connections = await relationships.getByDocument('bruceWayne', 'en');

      const existingHubConnections = connections.filter(c => c.hub.equals(hub9));
      const newHubCreated = connections.filter(c => !c.hub.equals(hub9));

      expect(existingHubConnections.length).toBe(4);

      expect(newHubCreated.length).toBe(3);
      expect(newHubCreated.find(c => c.entity === 'robin').template.toString()).toBe(
        friend.toString()
      );
      expect(newHubCreated.find(c => c.entity === 'alfred').template.toString()).toBe(
        friend.toString()
      );
      expect(newHubCreated.find(c => c.entity === 'bruceWayne').template).toBe(null);
    });

    it('should delete connections based on properties', async () => {
      await relationships.saveEntityBasedReferences(entity, 'en');

      await saveReferencesChangingMetadataTo({
        family: [{ value: 'thomasWayne' }],
        friend: [{ value: 'alfred' }],
      });
      let connections = await relationships.getByDocument('bruceWayne', 'en');
      expect(connections.length).toBe(6);
      expect(connections.find(c => c.entity === 'robin')).not.toBeDefined();

      await saveReferencesChangingMetadataTo({
        family: [{ value: 'alfred' }],
        friend: [{ value: 'robin' }],
      });
      connections = await relationships.getByDocument('bruceWayne', 'en');

      expect(connections.find(c => c.entity === 'thomasWayne')).not.toBeDefined();
      expect(connections.find(c => c.entity === 'alfred').template.toString()).toBe(
        family.toString()
      );
      expect(connections.length).toBe(7);
    });
  });

  describe('search()', () => {
    it('should prepare a query with ids based on an entity id and a searchTerm', async () => {
      const searchResponse = Promise.resolve({ rows: [] });
      jest.spyOn(search, 'search').mockReturnValue(searchResponse);
      await relationships.search('entity2', { filter: {}, searchTerm: 'something' }, 'en');
      const actualQuery = search.search.mock.calls[0][0];
      expect(actualQuery.searchTerm).toEqual('something');
      expect(actualQuery.ids).toEqual(
        expect.arrayContaining(['doc5', 'doc4', 'entity3', 'entity1'])
      );
      expect(actualQuery.includeUnpublished).toBe(true);
      expect(actualQuery.limit).toBe(9999);
    });

    it('should filter out ids based on filtered relation types and templates, and pass the user to search', async () => {
      const searchResponse = Promise.resolve({ rows: [] });
      jest.spyOn(search, 'search').mockReturnValue(searchResponse);
      const query = { filter: {}, searchTerm: 'something' };
      query.filter[relation2] = [relation2 + template];

      await relationships.search('entity2', query, 'en', 'user');

      const actualQuery = search.search.mock.calls[0][0];
      const language = search.search.mock.calls[0][1];
      const user = search.search.mock.calls[0][2];

      expect(actualQuery.searchTerm).toEqual('something');
      expect(actualQuery.ids).toEqual(expect.arrayContaining(['doc4', 'entity3']));
      expect(actualQuery.includeUnpublished).toBe(true);
      expect(actualQuery.limit).toBe(9999);

      expect(language).toBe('en');
      expect(user).toBe('user');
    });

    it('should return the matching entities with their relationships and the current entity with the respective relationships', async () => {
      const searchResponse = Promise.resolve({
        rows: [
          { sharedId: 'entity1' },
          { sharedId: 'entity3' },
          { sharedId: 'doc4' },
          { sharedId: 'doc5' },
        ],
      });
      jest.spyOn(search, 'search').mockReturnValue(searchResponse);
      const result = await relationships.search(
        'entity2',
        { filter: {}, searchTerm: 'something' },
        'en'
      );
      expect(result.rows.length).toBe(5);
      expect(result.rows[0].connections.length).toBe(1);
      expect(result.rows[1].connections.length).toBe(4);
      expect(result.rows[2].connections.length).toBe(1);
      expect(result.rows[3].connections.length).toBe(1);
      expect(result.rows[4].connections.length).toBe(5);
    });

    it('should return number of hubs (total and requested) and allow limiting the number of HUBs returned', async () => {
      const searchResponse = Promise.resolve({
        rows: [
          { sharedId: 'entity1' },
          { sharedId: 'entity3' },
          { sharedId: 'doc4' },
          { sharedId: 'doc5' },
        ],
      });
      jest.spyOn(search, 'search').mockReturnValue(searchResponse);

      const result = await relationships.search(
        'entity2',
        { filter: {}, searchTerm: 'something', limit: 2 },
        'en'
      );
      expect(result.totalHubs).toBe(5);
      expect(result.requestedHubs).toBe(2);

      const expectedHubIds = result.rows[result.rows.length - 1].connections.map(c =>
        c.hub.toString()
      );
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
      const response = await relationships.delete({ _id: connectionID1 }, 'en');
      const hub7Connections = await relationships.get({ hub: hub7 });
      expect(
        hub7Connections.filter(c => c._id.toString() === connectionID1.toString()).length
      ).toBe(0);
      expect(response.acknowledged).toBe(true);
    });

    it('should not leave a lone connection in the hub', async () => {
      await relationships.delete({ _id: connectionID1 }, 'en');
      await relationships.delete({ _id: connectionID3 }, 'en');
      await relationships.delete({ _id: connectionID2 }, 'en');

      const hubRelationships = await relationships.get({ hub: hub7 });

      expect(hubRelationships).toEqual([]);
    });

    describe('when deleting relations for an entity', () => {
      it('should not leave single relationship hubs', async () => {
        await relationships.delete({ entity: 'entity3' }, 'en');

        const hub2Relationships = await relationships.get({ hub: hub2 });
        const hub11Relationships = await relationships.get({ hub: hub11 });

        expect(hub2Relationships).toEqual([]);
        expect(hub11Relationships).toEqual([]);
      });
    });

    it('should not delete the hub when specific combos yield a hub with less than 2 connections', async () => {
      await relationships.delete({ _id: connectionID4 }, 'es');

      const hubRelationships = await relationships.get({ hub: hub12 });

      expect(hubRelationships.length).toBe(2);
      expect(hubRelationships.filter(c => c.entity === 'entity1').length).toBe(1);
      expect(hubRelationships.filter(c => c.entity === 'doc2').length).toBe(1);
    });

    it('should call entities to update the metadata', async () => {
      await relationships.delete({ entity: 'bruceWayne' }, 'en');

      expect(entities.updateMetdataFromRelationships).toHaveBeenCalledTimes(2);

      const expectedDocs = ['doc2', 'IHaveNoTemplate', 'thomasWayne', 'bruceWayne'];
      let expectedLanguages = ['en', 'es'];
      const args = entities.updateMetdataFromRelationships.mock.calls;
      args.forEach(arg => {
        const [docs, languages] = arg;
        expectedDocs.forEach(doc => {
          expect(docs).toContain(doc);
        });

        expect(expectedLanguages).toContain(languages);
        expectedLanguages = expectedLanguages.filter(lang => lang !== languages);
      });

      expect(expectedLanguages).toEqual([]);
    });

    describe('when there is no condition', () => {
      it('should throw an error', done => {
        relationships
          .delete()
          .then(() => {
            done.fail('Should throw an error');
          })
          .catch(error => {
            expect(error.code).toBe(500);
            done();
          });
      });
    });
  });

  describe('deleteTextReferences()', () => {
    it('should delete the entity text relationships (that match language)', async () => {
      await relationships.deleteTextReferences('doc2', 'en');

      const [relationshipsInEnglish, relationshipsInPT] = await Promise.all([
        relationships.getByDocument('doc2', 'en'),
        relationships.getByDocument('doc2', 'pt'),
      ]);

      expect(relationshipsInEnglish.length).toBe(4);
      expect(relationshipsInPT.length).toBe(8);
    });

    it('should not delete text relationships if filename also used in other languages', async () => {
      await relationships.deleteTextReferences('doc5', 'en');
      const doc5Relationships = await relationships.get({ entity: 'doc5', hub: hub5 });
      expect(doc5Relationships.length).toBe(1);
    });

    it('should not leave a lone connection in the hub', async () => {
      await relationships.delete({ entity: 'entity_id' }, 'en');
      await relationships.deleteTextReferences('doc2', 'en');
      await relationships.deleteTextReferences('doc2', 'pt');

      const hubRelationships = await relationships.get({ hub: hub8 });

      expect(hubRelationships).toEqual([]);
    });

    it('should not delete any relationships if entity.file.filename if undefined', async () => {
      await relationships.deleteTextReferences('entity1', 'en');
      const hubRelationships = await relationships.getByDocument('entity1', 'en');
      expect(hubRelationships.length).toEqual(5);
    });
  });
});
