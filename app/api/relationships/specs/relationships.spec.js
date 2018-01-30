/* eslint-disable max-nested-callbacks */
import relationships from '../relationships.js';
import {catchErrors} from 'api/utils/jasmineHelpers';

import db from 'api/utils/testing_db';
import fixtures, {connectionID1, hub1, hub7} from './fixtures.js';
import {relation1, relation2, template} from './fixtures.js';
import search from '../../search/search';

describe('relationships', () => {
  beforeEach((done) => {
    db.clearAllAndLoad(fixtures, (err) => {
      if (err) {
        done.fail(err);
      }
      done();
    });
  });

  describe('get()', () => {
    it('should return all the relationships', (done) => {
      relationships.get()
      .then((result) => {
        expect(result.length).toBe(20);
        done();
      }).catch(catchErrors(done));
    });
  });

  describe('getByDocument()', () => {
    it('should return all the relationships of a document in the current language', (done) => {
      relationships.getByDocument('source2', 'en')
      .then((result) => {
        expect(result.length).toBe(8);
        const source1Connection = result.find((connection) => connection.entity === 'source1');
        expect(source1Connection.range).toEqual({text: 'english'});
        expect(source1Connection.entityData.title).toBe('source1 title');
        expect(source1Connection.entityData.icon).toBe('icon1');
        expect(source1Connection.entityData.type).toBe('document');
        expect(source1Connection.entityData.template).toEqual(template);
        expect(source1Connection.entityData.metadata).toEqual({data: 'data1'});
        expect(source1Connection.entityData.creationDate).toEqual(123);
        expect(source1Connection.entityData.file).toEqual({language: 'spa'});

        const doc3Connection = result.find((connection) => connection.entity === 'doc3');
        expect(doc3Connection.range).toEqual({text: 'english'});
        expect(doc3Connection.entityData.title).toBe('doc3 title');
        expect(doc3Connection.entityData.icon).toBe('icon3');
        expect(doc3Connection.entityData.type).toBe('entity');
        expect(doc3Connection.entityData.template).toEqual(template);
        expect(doc3Connection.entityData.published).toBe(true);
        expect(doc3Connection.entityData.metadata).toEqual({data: 'data2'});
        expect(doc3Connection.entityData.creationDate).toEqual(456);
        expect(doc3Connection.entityData.file).toBeUndefined();

        done();
      })
      .catch(catchErrors(done));
    });
  });

  describe('getGroupsByConnection()', () => {
    it('should return groups of connection types and templates of all the relationships of a document', (done) => {
      relationships.getGroupsByConnection('source2', 'en')
      .then(results => {
        const group1 = results.find((r) => r.key === relation1.toString());
        expect(group1.key).toBe(relation1.toString());
        expect(group1.connectionLabel).toBe('relation 1');
        expect(group1.context).toBe(relation1.toString());
        expect(group1.templates.length).toBe(1);
        expect(group1.templates[0].count).toBe(1);

        const group2 = results.find((r) => r.key === relation2.toString());
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
      relationships.getGroupsByConnection('source2', 'en', {user: 'found'})
      .then(results => {
        expect(results.length).toBe(2);
        const group1 = results.find((r) => r.key === relation1.toString());
        expect(group1.key).toBe(relation1.toString());
        expect(group1.templates[0]._id.toString()).toBe(template.toString());

        const group2 = results.find((r) => r.key === relation2.toString());
        expect(group2.key).toBe(relation2.toString());
        expect(group2.templates[0].count).toBe(2);

        done();
      })
      .catch(catchErrors(done));
    });

    it('should return groups of connection wihtout refs if excluded', (done) => {
      relationships.getGroupsByConnection('source2', 'en', {excludeRefs: true})
      .then(results => {
        expect(results.length).toBe(2);
        expect(results[0].templates[0].refs).toBeUndefined();
        expect(results[1].templates[0].refs).toBeUndefined();

        done();
      })
      .catch(catchErrors(done));
    });
  });

  describe('getHub()', () => {
    it('should return all the connections of the smae hub', (done) => {
      relationships.getHub(hub1)
      .then((result) => {
        expect(result.length).toBe(2);
        expect(result[0].entity).toBe('source1');
        expect(result[1].entity).toBe('source2');
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

  describe('save()', () => {
    describe('When creating a new reference to a hub', () => {
      it('should save it and return it with the entity data', (done) => {
        relationships.save({entity: 'doc3', range: {text: 'range'}, hub: hub1}, 'en')
        .then(([result]) => {
          expect(result.entity).toBe('doc3');
          expect(result.entityData.template).toEqual(template);
          expect(result.entityData.type).toBe('entity');
          expect(result.entityData.title).toBe('doc3 title');
          expect(result.entityData.published).toBe(true);
          expect(result.range).toEqual({text: 'range'});

          expect(result._id).toBeDefined();
          done();
        })
        .catch(catchErrors(done));
      });
    });

    describe('When creating new relationships', () => {
      it('should assign them a hub and return them with the entity data', (done) => {
        relationships.save([{entity: 'doc3'}, {entity: 'doc4'}], 'en')
        .then(([doc3Connection, doc4Connection]) => {
          expect(doc3Connection.entity).toBe('doc3');
          expect(doc3Connection.entityData.template).toEqual(template);
          expect(doc3Connection.entityData.type).toBe('entity');
          expect(doc3Connection.entityData.title).toBe('doc3 title');
          expect(doc3Connection.entityData.published).toBe(true);

          expect(doc3Connection._id).toBeDefined();
          expect(doc3Connection.hub).toBeDefined();

          expect(doc4Connection.entity).toBe('doc4');
          expect(doc4Connection.entityData.template).toEqual(template);
          expect(doc4Connection.entityData.type).toBe('document');
          expect(doc4Connection.entityData.title).toBe('doc4 title');
          expect(doc4Connection.entityData.published).not.toBeDefined();

          expect(doc4Connection._id).toBeDefined();
          expect(doc4Connection.hub).toBeDefined();
          expect(doc4Connection.hub.toString()).toBe(doc3Connection.hub.toString());
          done();
        })
        .catch(catchErrors(done));
      });

      it('should assign them language if its a text reference', (done) => {
        relationships.save([{entity: 'doc3'}, {entity: 'doc4', range: {text: 'something'}}], 'en')
        .then(([doc3Connection, doc4Connection]) => {
          expect(doc3Connection.language).not.toBeDefined();
          expect(doc4Connection.language).toBe('en');
          done();
        })
        .catch(catchErrors(done));
      });
    });

    describe('when the reference exists', () => {
      it('should update it', (done) => {
        relationships.getById(connectionID1)
        .then((reference) => {
          reference.entity = 'source1';
          return relationships.save(reference, 'en');
        })
        .then(([result]) => {
          expect(result.entity).toBe('source1');
          expect(result._id.equals(connectionID1)).toBe(true);
          done();
        })
        .catch(catchErrors(done));
      });
    });

    describe('when saving one reference without hub', () => {
      it('should throw an error', (done) => {
        relationships.save({entity: 'doc3', range: {text: 'range'}}, 'en')
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
      .then(() => {
        return relationships.getByDocument('bruceWayne');
      })
      .then((connections) => {
        expect(connections.length).toBe(2);
        expect(connections.find((connection) => connection.entity === 'bruceWayne')).toBeDefined();
        expect(connections.find((connection) => connection.entity === 'robin')).toBeDefined();
        expect(connections[0].hub).toEqual(connections[1].hub);
        done();
      });
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
        expect(connections.length).toBe(4);
        done();
      });
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
        expect(connections.length).toBe(5);
        entity.metadata = {
          family: ['thomasWayne'],
          friend: ['alfred']
        };
        return relationships.saveEntityBasedReferences(entity, 'en');
      })
      .then(() => relationships.getByDocument('bruceWayne', 'en'))
      .then((connections) => {
        expect(connections.length).toBe(4);
        entity.metadata = {
          family: ['alfred'],
          friend: ['robin']
        };
        return relationships.saveEntityBasedReferences(entity, 'en');
      })
      .then(() => relationships.getByDocument('bruceWayne', 'en'))
      .then((connections) => {
        expect(connections.length).toBe(4);
        done();
      });
    });
  });

  describe('search()', () => {
    it('should prepare a query with ids based on an entity id and a searchTerm', (done) => {
      const searchResponse = Promise.resolve({rows: []});
      spyOn(search, 'search').and.returnValue(searchResponse);
      relationships.search('source2', {filter: {}, searchTerm: 'something'}, 'en')
      .then(() => {
        let actualQuery = search.search.calls.mostRecent().args[0];
        expect(actualQuery.searchTerm).toEqual('something');
        expect(actualQuery.ids).toEqual(['doc5', 'doc4', 'doc3', 'source1']);
        expect(actualQuery.includeUnpublished).toBe(true);
        expect(actualQuery.limit).toBe(9999);
        done();
      });
    });

    it('should filter out ids based on filtered relation types and templates', (done) => {
      const searchResponse = Promise.resolve({rows: []});
      spyOn(search, 'search').and.returnValue(searchResponse);
      let query = {filter: {}, searchTerm: 'something'};
      query.filter[relation2] = [relation2 + template];
      relationships.search('source2', query, 'en')
      .then(() => {
        let actualQuery = search.search.calls.mostRecent().args[0];
        expect(actualQuery.searchTerm).toEqual('something');
        expect(actualQuery.ids).toEqual(['doc4', 'doc3']);
        expect(actualQuery.includeUnpublished).toBe(true);
        expect(actualQuery.limit).toBe(9999);
        done();
      });
    });

    it('should return the matching entities with their relationships and the current entity with the respective relationships', (done) => {
      const searchResponse = Promise.resolve({rows: [{sharedId: 'source1'}, {sharedId: 'doc3'}, {sharedId: 'doc4'}, {sharedId: 'doc5'}]});
      spyOn(search, 'search').and.returnValue(searchResponse);
      relationships.search('source2', {filter: {}, searchTerm: 'something'}, 'en')
      .then((result) => {
        expect(result.rows.length).toBe(5);
        expect(result.rows[0].connections.length).toEqual(1);
        expect(result.rows[1].connections.length).toEqual(1);
        expect(result.rows[2].connections.length).toEqual(1);
        expect(result.rows[3].connections.length).toEqual(1);
        expect(result.rows[4].connections.length).toEqual(4);
        done();
      });
    });
  });

  describe('delete()', () => {
    it('should delete the reference and dont leave lone connection in the hub', (done) => {
      return relationships.delete(connectionID1)
      .then(() => {
        return relationships.getHub(hub7);
      })
      .then((result) => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should delete all the relationships for complex conditions', (done) => {
      return relationships.delete({entity: 'source2'})
      .then(() => {
        return relationships.getByDocument('source2');
      })
      .then((result) => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should delete an entire hub when passing 2 of its elements', (done) => {
      return relationships.delete({entity: 'source2'})
      .then(() => {
        return relationships.getByDocument('source2');
      })
      .then((result) => {
        expect(result).toEqual([]);
        done();
      });
    });

    describe('when there is no condition', () => {
      it('should throw an error', (done) => {
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
      relationships.deleteTextReferences('doc3', 'en')
      .then(() => {
        return Promise.all([relationships.getByDocument('doc3', 'en'), relationships.getByDocument('doc3', 'ru')]);
      })
      .then(([relationshipsInEnglish, relationshipsInRusian]) => {
        expect(relationshipsInEnglish.length).toBe(0);
        expect(relationshipsInRusian.length).toBe(2);
        done();
      });
    });
  });
});
