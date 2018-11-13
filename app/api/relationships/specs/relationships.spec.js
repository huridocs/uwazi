/* eslint-disable max-nested-callbacks */
import db from 'api/utils/testing_db';
import entities from 'api/entities/entities';
import { catchErrors } from 'api/utils/jasmineHelpers';

import relationships from '../relationships';
import fixtures, { connectionID1, connectionID2, connectionID3, connectionID4, connectionID5, connectionID6,
  hub1, hub2, hub7, hub11, hub12, relation1, relation2, template, sharedId4 } from './fixtures';
import search from '../../search/search';

describe('relationships', () => {
  beforeEach((done) => {
    spyOn(entities, 'updateMetdataFromRelationships').and.returnValue(Promise.resolve());
    db.clearAllAndLoad(fixtures).then(done).catch(catchErrors(done));
  });

  afterAll((done) => {
    db.disconnect().then(done);
  });

  describe('getByDocument()', () => {
    it('should return all the relationships of a document in the current language', (done) => {
      relationships.getByDocument('entity2', 'en')
      .then((result) => {
        expect(result.length).toBe(10);
        const entity1Connection = result.find(connection => connection.entity === 'entity1');
        expect(entity1Connection.entityData.title).toBe('entity1 title');
        expect(entity1Connection.entityData.icon).toBe('icon1');
        expect(entity1Connection.entityData.type).toBe('document');
        expect(entity1Connection.entityData.template).toEqual(template);
        expect(entity1Connection.entityData.metadata).toEqual({ data: 'data1' });
        expect(entity1Connection.entityData.creationDate).toEqual(123);

        const entity3Connection = result.find(connection => connection.entity === 'entity3');
        expect(entity3Connection.entityData.title).toBe('entity3 title');
        expect(entity3Connection.entityData.icon).toBe('icon3');
        expect(entity3Connection.entityData.type).toBe('entity');
        expect(entity3Connection.entityData.template).toEqual(template);
        expect(entity3Connection.entityData.published).toBe(true);
        expect(entity3Connection.entityData.metadata).toEqual({ data: 'data2' });
        expect(entity3Connection.entityData.creationDate).toEqual(456);
        expect(entity3Connection.entityData.file).toBeUndefined();

        done();
      })
      .catch(catchErrors(done));
    });

    it('should set template to null if no template found', (done) => {
      relationships.getByDocument('entity2', 'en')
      .then((results) => {
        const noTemplateConnection = results.find(connection => connection.sharedId.toString() === sharedId4.toString());
        expect(noTemplateConnection.template).toBe(null);
        done();
      });
    });
  });

  describe('getGroupsByConnection()', () => {
    it('should return groups of connection types and templates of all the relationships of a document', (done) => {
      relationships.getGroupsByConnection('entity2', 'en')
      .then((results) => {
        const group1 = results.find(r => r.key === relation1.toString());
        expect(group1.key).toBe(relation1.toString());
        expect(group1.connectionLabel).toBe('relation 1');
        expect(group1.context).toBe(relation1.toString());
        expect(group1.templates.length).toBe(1);
        expect(group1.templates[0].count).toBe(2);

        const group2 = results.find(r => r.key === relation2.toString());
        expect(group2.key).toBe(relation2.toString());
        expect(group2.connectionLabel).toBe('relation 2');
        expect(group2.context).toBe(relation2.toString());
        expect(group2.templates.length).toBe(1);

        expect(group2.templates[0]._id.toString()).toBe(template.toString());
        expect(group2.templates[0].label).toBe('template');

        done();
      })
      .catch(catchErrors(done));
    });

    it('should return groups of connection including unpublished docs if user is found', (done) => {
      relationships.getGroupsByConnection('entity2', 'en', { user: 'found' })
      .then((results) => {
        expect(results.length).toBe(3);
        const group1 = results.find(r => r.key === relation1.toString());
        expect(group1.key).toBe(relation1.toString());
        expect(group1.templates[0]._id.toString()).toBe(template.toString());

        const group2 = results.find(r => r.key === relation2.toString());
        expect(group2.key).toBe(relation2.toString());
        expect(group2.templates[0].count).toBe(2);

        const group3 = results.find(r => !r.key);
        expect(group3.key).toBe(null);
        expect(group3.templates[0].count).toBe(1);

        done();
      })
      .catch(catchErrors(done));
    });

    it('should return groups of connection wihtout refs if excluded', (done) => {
      relationships.getGroupsByConnection('entity2', 'en', { excludeRefs: true })
      .then((results) => {
        expect(results.length).toBe(3);
        expect(results[0].templates[0].refs).toBeUndefined();
        expect(results[1].templates[0].refs).toBeUndefined();
        expect(results[2].templates[0].refs).toBeUndefined();

        done();
      })
      .catch(catchErrors(done));
    });
  });

  describe('getHub()', () => {
    it('should return all the connections of the smae hub', (done) => {
      relationships.getHub(hub1, 'en')
      .then((result) => {
        expect(result.length).toBe(2);
        expect(result[0].entity).toBe('entity1');
        expect(result[1].entity).toBe('entity2');
        done();
      }).catch(catchErrors(done));
    });
  });

  describe('countByRelationType()', () => {
    it('should return number of relationships using a relationType', (done) => {
      relationships.countByRelationType(relation2.toString())
      .then((result) => {
        expect(result).toBe(6);
        done();
      }).catch(catchErrors(done));
    });

    it('should return zero when none is using it', (done) => {
      const notUsedRelation = db.id().toString();
      relationships.countByRelationType(notUsedRelation)
      .then((result) => {
        expect(result).toBe(0);
        done();
      }).catch(catchErrors(done));
    });
  });

  describe('bulk()', () => {
    fit('should save or delete the relationships', async () => {
      const data = {
        save: [{ _id: connectionID5, entity: 'entity3', hub: hub2, template: relation2, range: { text: 'changed text' } }],
        delete: [{ _id: connectionID2 }, { _id: connectionID3 }]
      };

      const response = await relationships.bulk(data, 'en');
      expect(response).toEqual({ success: 'ok' });

      const savedReference = await relationships.getById(connectionID5);
      expect(savedReference.range.text).toBe('changed text');

      const deletedReference2 = await relationships.getById(connectionID2);
      expect(deletedReference2).toBe(null);
      const deletedReference3 = await relationships.getById(connectionID3);
      expect(deletedReference3).toBe(null);
    });

    fit('should first save and then delete to prevent sidefects of hub sanitizing', async () => {
      const data = {
        save: [{ entity: 'new relationship entity', hub: hub11 }],
        delete: [{ _id: connectionID6 }]
      };

      await relationships.bulk(data, 'en');
      const hubRelationships = await relationships.getHub(hub11);
      expect(hubRelationships.length).toBe(2);
    });
  });

  describe('save()', () => {
    describe('When creating a new reference to a hub', () => {
      fit('should save it and return it with the entity data', async () => {
        const [result] = await relationships.save({ entity: 'entity3', hub: hub1 }, 'en');

        expect(result.entity).toBe('entity3');
        expect(result.entityData.template).toEqual(template);
        expect(result.entityData.type).toBe('entity');
        expect(result.entityData.title).toBe('entity3 title');
        expect(result.entityData.published).toBe(true);
        expect(result._id).toBeDefined();
      });

      fit('should call entities to update the metadata', async () => {
        await relationships.save({ entity: 'entity3', hub: hub1 }, 'en');
        expect(entities.updateMetdataFromRelationships).toHaveBeenCalledWith(['entity1', 'entity2', 'entity3'], 'en');
      });
    });

    describe('When creating new relationships', () => {
      fit('should assign them a hub and return them with the entity data', async () => {
        const [entity3Connection, doc4Connection] = await relationships.save([{ entity: 'entity3' }, { entity: 'doc4' }], 'en');

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

      describe('when creating text references', () => {
        fit('should assign them the file they belong to', async () => {
          const saveResult = await relationships.save([
            { entity: 'doc5', range: { text: 'one thing' } },
            { entity: 'doc4', range: { text: 'something' } },
          ], 'es');

          expect(saveResult.length).toBe(2);
          expect(saveResult[0].filename).toBe('doc5enFile');
          expect(saveResult[1].filename).toBe('doc4enFile');
        });
      });
    });

    describe('when the reference exists', () => {
      fit('should update it', async () => {
        const reference = await relationships.getById(connectionID1);
        reference.entity = 'entity1';
        await relationships.save(reference, 'en');

        const changedReference = await relationships.getById(connectionID1);

        expect(changedReference.entity).toBe('entity1');
        expect(changedReference._id.equals(connectionID1)).toBe(true);
      });

      fit('should update correctly if ID is not a mongo ObjectId', async () => {
        const reference = await relationships.getById(connectionID1);
        reference._id = reference._id.toString();
        reference.entity = 'entity1';

        const [changedReference] = await relationships.save(reference, 'en');

        expect(changedReference.entity).toBe('entity1');
        expect(changedReference._id.equals(connectionID1)).toBe(true);
      });

      fit('should update correctly if template is null', async () => {
        const reference = await relationships.getById(connectionID1);
        reference.template = { _id: null };
        const [savedReference] = await relationships.save(reference, 'en');
        expect(savedReference.entity).toBe('entity_id');
        expect(savedReference.template).toBe(null);
      });
    });

    describe('when saving one reference without hub', () => {
      fit('should throw an error', (done) => {
        relationships.save({ entity: 'entity3', range: { text: 'range' } }, 'en')
        .then(() => {
          done.fail('Should throw an error');
        })
        .catch((error) => {
          expect(error.code).toBe(500);
          done();
        });
      });
    });
  });

  describe('saveEntityBasedReferences()', () => {
    it('should create connections based on properties', (done) => {
      const entity = {
        template: template.toString(),
        sharedId: 'bruceWayne',
        metadata: {
          friend: ['robin']
        }
      };

      relationships.saveEntityBasedReferences(entity, 'en')
      .then(() => relationships.getByDocument('bruceWayne', 'en'))
      .then((connections) => {
        expect(connections.length).toBe(4);
        expect(connections.find(connection => connection.entity === 'bruceWayne')).toBeDefined();
        expect(connections.find(connection => connection.entity === 'robin')).toBeDefined();
        expect(connections[0].hub).toEqual(connections[1].hub);
        done();
      })
      .catch(catchErrors(done));
    });

    it('should not create existing connections based on properties', (done) => {
      const entity = {
        template: template.toString(),
        sharedId: 'bruceWayne',
        metadata: {
          family: ['thomasWayne'],
          friend: ['robin']
        }
      };

      relationships.saveEntityBasedReferences(entity, 'en')
      .then(() => relationships.saveEntityBasedReferences(entity, 'en'))
      .then(() => relationships.getByDocument('bruceWayne', 'en'))
      .then((connections) => {
        expect(connections.length).toBe(5);
        done();
      })
      .catch(catchErrors(done));
    });

    it('should delete connections based on properties', (done) => {
      const entity = {
        template: template.toString(),
        sharedId: 'bruceWayne',
        metadata: {
          family: ['thomasWayne'],
          friend: ['robin', 'alfred']
        }
      };

      relationships.saveEntityBasedReferences(entity, 'en')
      .then(() => relationships.getByDocument('bruceWayne', 'en'))
      .then((connections) => {
        expect(connections.length).toBe(6);
        entity.metadata = {
          family: ['thomasWayne'],
          friend: ['alfred']
        };
        return relationships.saveEntityBasedReferences(entity, 'en');
      })
      .then(() => relationships.getByDocument('bruceWayne', 'en'))
      .then((connections) => {
        expect(connections.length).toBe(5);
        entity.metadata = {
          family: ['alfred'],
          friend: ['robin']
        };
        return relationships.saveEntityBasedReferences(entity, 'en');
      })
      .then(() => relationships.getByDocument('bruceWayne', 'en'))
      .then((connections) => {
        expect(connections.length).toBe(6);
        done();
      })
      .catch(catchErrors(done));
    });
  });

  describe('search()', () => {
    it('should prepare a query with ids based on an entity id and a searchTerm', (done) => {
      const searchResponse = Promise.resolve({ rows: [] });
      spyOn(search, 'search').and.returnValue(searchResponse);
      relationships.search('entity2', { filter: {}, searchTerm: 'something' }, 'en')
      .then(() => {
        const actualQuery = search.search.calls.mostRecent().args[0];
        expect(actualQuery.searchTerm).toEqual('something');
        expect(actualQuery.ids).containItems(['doc5', 'doc4', 'entity3', 'entity1']);
        expect(actualQuery.includeUnpublished).toBe(true);
        expect(actualQuery.limit).toBe(9999);
        done();
      })
      .catch(catchErrors(done));
    });

    it('should filter out ids based on filtered relation types and templates, and pass the user to search', (done) => {
      const searchResponse = Promise.resolve({ rows: [] });
      spyOn(search, 'search').and.returnValue(searchResponse);
      const query = { filter: {}, searchTerm: 'something' };
      query.filter[relation2] = [relation2 + template];
      relationships.search('entity2', query, 'en', 'user')
      .then(() => {
        const actualQuery = search.search.calls.mostRecent().args[0];
        const language = search.search.calls.mostRecent().args[1];
        const user = search.search.calls.mostRecent().args[2];

        expect(actualQuery.searchTerm).toEqual('something');
        expect(actualQuery.ids).containItems(['doc4', 'entity3']);
        expect(actualQuery.includeUnpublished).toBe(true);
        expect(actualQuery.limit).toBe(9999);

        expect(language).toBe('en');
        expect(user).toBe('user');
        done();
      })
      .catch(catchErrors(done));
    });

    it('should return the matching entities with their relationships and the current entity with the respective relationships', (done) => {
      const searchResponse = Promise.resolve(
        { rows: [
          { sharedId: 'entity1' },
          { sharedId: 'entity3' },
          { sharedId: 'doc4' },
          { sharedId: 'doc5' }
        ] }
      );
      spyOn(search, 'search').and.returnValue(searchResponse);
      relationships.search('entity2', { filter: {}, searchTerm: 'something' }, 'en')
      .then((result) => {
        expect(result.rows.length).toBe(5);
        expect(result.rows[0].connections.length).toBe(1);
        expect(result.rows[1].connections.length).toBe(3);
        expect(result.rows[2].connections.length).toBe(1);
        expect(result.rows[3].connections.length).toBe(1);
        expect(result.rows[4].connections.length).toBe(4);
        done();
      })
      .catch(catchErrors(done));
    });

    it('should retrun number of hubs (total and requested) and allow limiting the number of HUBs returned', (done) => {
      const searchResponse = Promise.resolve(
        { rows: [
          { sharedId: 'entity1' },
          { sharedId: 'entity3' },
          { sharedId: 'doc4' },
          { sharedId: 'doc5' }
        ] });
      spyOn(search, 'search').and.returnValue(searchResponse);

      relationships.search('entity2', { filter: {}, searchTerm: 'something', limit: 2 }, 'en')
      .then((result) => {
        expect(result.totalHubs).toBe(4);
        expect(result.requestedHubs).toBe(2);
        const expectedHubIds = result.rows[result.rows.length - 1].connections.map(c => c.hub.toString());

        expect(result.rows[0].sharedId).toBe('entity1');
        expect(result.rows[0].connections.length).toBe(1);
        expect(expectedHubIds).toContain(result.rows[0].connections[0].hub.toString());

        expect(result.rows[1].sharedId).toBe('entity3');
        expect(result.rows[1].connections.length).toBe(2);
        expect(expectedHubIds).toContain(result.rows[1].connections[0].hub.toString());
        expect(expectedHubIds).toContain(result.rows[1].connections[1].hub.toString());

        expect(result.rows[2].sharedId).toBe('entity2');
        expect(result.rows[2].connections.length).toBe(2);

        done();
      })
      .catch(catchErrors(done));
    });
  });

  describe('delete()', () => {
    fit('should delete the relationship', async () => {
      const response = await relationships.delete({ _id: connectionID1 }, 'en');
      const hub7Connections = await relationships.get({ hub: hub7 });
      expect(hub7Connections.filter(c => c._id.toString() === connectionID1.toString()).length).toBe(0);
      expect(JSON.parse(response).ok).toBe(1);
    });

    fit('should not leave a lone connection in the hub', async () => {
      await relationships.delete({ _id: connectionID1 }, 'en');
      await relationships.delete({ _id: connectionID3 }, 'en');
      await relationships.delete({ _id: connectionID2 }, 'en');

      const hubRelationships = await relationships.get({ hub: hub7 });

      expect(hubRelationships).toEqual([]);
    });

    describe('when deleting relations for an entity', () => {
      fit('should not leave single relationship hubs', async () => {
        await relationships.delete({ entity: 'entity3' }, 'en');

        const hub2Relationships = await relationships.get({ hub: hub2 });
        const hub11Relationships = await relationships.get({ hub: hub11 });

        expect(hub2Relationships).toEqual([]);
        expect(hub11Relationships).toEqual([]);
      });
    });

    fit('should not delete the hub when specific combos yield a hub with less than 2 connections', async () => {
      await relationships.delete({ _id: connectionID4 }, 'es');

      const hubRelationships = await relationships.get({ hub: hub12 });

      expect(hubRelationships.length).toBe(2);
      expect(hubRelationships.filter(c => c.entity === 'entity1').length).toBe(1);
      expect(hubRelationships.filter(c => c.entity === 'doc2').length).toBe(1);
    });

    fit('should call entities to update the metadata', async () => {
      await relationships.delete({ entity: 'bruceWayne' }, 'en');

      expect(entities.updateMetdataFromRelationships).toHaveBeenCalledWith(['IHaveNoTemplate', 'thomasWayne', 'bruceWayne'], 'en');
      expect(entities.updateMetdataFromRelationships).toHaveBeenCalledWith(['IHaveNoTemplate', 'thomasWayne', 'bruceWayne'], 'es');
    });

    describe('when there is no condition', () => {
      fit('should throw an error', (done) => {
        relationships.delete()
        .then(() => {
          done.fail('Should throw an error');
        })
        .catch((error) => {
          expect(error.code).toBe(500);
          done();
        });
      });
    });
  });

  describe('deleteTextReferences()', () => {
    it('should delete the entity text relationships (that match language)', (done) => {
      relationships.deleteTextReferences('entity3', 'en')
      .then(() => Promise.all([relationships.getByDocument('entity3', 'en'), relationships.getByDocument('entity3', 'ru')]))
      .then(([relationshipsInEnglish, relationshipsInRusian]) => {
        expect(relationshipsInEnglish.length).toBe(5);
        expect(relationshipsInRusian.length).toBe(2);
        done();
      });
    });
  });
});
