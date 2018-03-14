/* eslint-disable max-nested-callbacks */
import relationships from '../relationships';
import entities from 'api/entities/entities';
import {catchErrors} from 'api/utils/jasmineHelpers';

import db from 'api/utils/testing_db';
import fixtures, {connectionID1, hub1, hub7} from './fixtures';
import {relation1, relation2, template} from './fixtures';
import search from '../../search/search';

describe('relationships', () => {
  beforeEach((done) => {
    spyOn(entities, 'updateMetdataFromRelationships').and.returnValue(Promise.resolve());
    db.clearAllAndLoad(fixtures).then(done).catch(catchErrors(done));
  });

  describe('getByDocument()', () => {
    it('should return all the relationships of a document in the current language', (done) => {
      relationships.getByDocument('entity2', 'en')
      .then((result) => {
        expect(result.length).toBe(10);
        const entity1Connection = result.find((connection) => connection.entity === 'entity1');
        expect(entity1Connection.entityData.title).toBe('entity1 title');
        expect(entity1Connection.entityData.icon).toBe('icon1');
        expect(entity1Connection.entityData.type).toBe('document');
        expect(entity1Connection.entityData.template).toEqual(template);
        expect(entity1Connection.entityData.metadata).toEqual({data: 'data1'});
        expect(entity1Connection.entityData.creationDate).toEqual(123);

        const entity3Connection = result.find((connection) => connection.entity === 'entity3');
        expect(entity3Connection.entityData.title).toBe('entity3 title');
        expect(entity3Connection.entityData.icon).toBe('icon3');
        expect(entity3Connection.entityData.type).toBe('entity');
        expect(entity3Connection.entityData.template).toEqual(template);
        expect(entity3Connection.entityData.published).toBe(true);
        expect(entity3Connection.entityData.metadata).toEqual({data: 'data2'});
        expect(entity3Connection.entityData.creationDate).toEqual(456);
        expect(entity3Connection.entityData.file).toBeUndefined();

        done();
      })
      .catch(catchErrors(done));
    });
  });

  describe('getGroupsByConnection()', () => {
    it('should return groups of connection types and templates of all the relationships of a document', (done) => {
      relationships.getGroupsByConnection('entity2', 'en')
      .then(results => {
        const group1 = results.find((r) => r.key === relation1.toString());
        expect(group1.key).toBe(relation1.toString());
        expect(group1.connectionLabel).toBe('relation 1');
        expect(group1.context).toBe(relation1.toString());
        expect(group1.templates.length).toBe(1);
        expect(group1.templates[0].count).toBe(2);

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
      relationships.getGroupsByConnection('entity2', 'en', {user: 'found'})
      .then(results => {
        expect(results.length).toBe(3);
        const group1 = results.find((r) => r.key === relation1.toString());
        expect(group1.key).toBe(relation1.toString());
        expect(group1.templates[0]._id.toString()).toBe(template.toString());

        const group2 = results.find((r) => r.key === relation2.toString());
        expect(group2.key).toBe(relation2.toString());
        expect(group2.templates[0].count).toBe(2);

        const group3 = results.find((r) => !r.key);
        expect(group3.key).toBe(null);
        expect(group3.templates[0].count).toBe(1);

        done();
      })
      .catch(catchErrors(done));
    });

    it('should return groups of connection wihtout refs if excluded', (done) => {
      relationships.getGroupsByConnection('entity2', 'en', {excludeRefs: true})
      .then(results => {
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

  describe('save()', () => {
    describe('When creating a new reference to a hub', () => {
      it('should save it and return it with the entity data', (done) => {
        relationships.save({entity: 'entity3', hub: hub1}, 'en')
        .then(([result]) => {
          expect(result.entity).toBe('entity3');
          expect(result.language).toBe('en');
          expect(result.entityData.template).toEqual(template);
          expect(result.entityData.type).toBe('entity');
          expect(result.entityData.title).toBe('entity3 title');
          expect(result.entityData.published).toBe(true);

          expect(result._id).toBeDefined();
          done();
        })
        .catch(catchErrors(done));
      });

      it('should call entities top update the metadata', (done) => {
        relationships.save({entity: 'entity3', hub: hub1}, 'en')
        .then(() => {
          expect(entities.updateMetdataFromRelationships).toHaveBeenCalledWith(['entity1', 'entity2', 'entity3'], 'en');
          done();
        });
      });
    });

    describe('When creating new relationships', () => {
      it('should assign them a hub and return them with the entity data', (done) => {
        relationships.save([{entity: 'entity3'}, {entity: 'doc4'}], 'en')
        .then(([entity3Connection, doc4Connection]) => {
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
          done();
        })
        .catch(catchErrors(done));
      });

      it('should create fallback relationships for all the languages versions of the entity', (done) => {
        relationships.save([{entity: 'entity4'}, {entity: 'entity1'}], 'en')
        .then(() => relationships.get({entity: 'entity4'}))
        .then((relations) => {
          expect(relations.length).toBe(2);
          done();
        })
        .catch(catchErrors(done));
      });

      it('should sync the metadata', (done) => {
        relationships.save([{entity: 'entity4', template: relation1.toString()}, {entity: 'entity1'}], 'en')
        .then(() => relationships.get({entity: 'entity4'}))
        .then((relations) => {
          const englishRelation = relations.find((r) => r.language === 'en');
          englishRelation.metadata = {name: 'English name', options: ['a', 'b'], date: 123453};
          return relationships.save(englishRelation, 'en')
          .then(() => relationships.get({entity: 'entity4'}));
        })
        .then((relations) => {
          const englishRelation = relations.find((r) => r.language === 'en');
          const rusianRelation = relations.find((r) => r.language === 'ru');
          expect(englishRelation.metadata).toEqual({name: 'English name', options: ['a', 'b'], date: 123453});
          expect(rusianRelation.metadata).toEqual({options: ['a', 'b'], date: 123453});
          done();
        })
        .catch(catchErrors(done));
      });

      describe('when creating text references', () => {
        it('should assign them language and fallback for the same document in other languages', (done) => {
          relationships.save([{entity: 'doc5', range: {text: 'one thing'}}, {entity: 'doc4', range: {text: 'something'}}], 'es')
          .then((saveResult) => {
            expect(saveResult.length).toBe(2);
            expect(saveResult[0].language).toBe('es');
            expect(saveResult[1].language).toBe('es');
            return Promise.all([relationships.get({entity: 'doc4'}), relationships.get({entity: 'doc5'})]);
          })
          .then(([doc4Realtions, doc5Relations]) => {
            expect(doc4Realtions.length).toBe(3);
            expect(doc5Relations.length).toBe(4);

            expect(doc4Realtions.find((r) => r.language === 'es')).toBeDefined();
            expect(doc4Realtions.find((r) => r.language === 'en')).toBeDefined();
            expect(doc4Realtions.find((r) => r.language === 'pt')).not.toBeDefined();
            return relationships.save(doc4Realtions.find((r) => r.language === 'en'), 'en')
            .then(() => relationships.get({entity: 'doc4'}));
          })
          .then((relations) => {
            expect(relations.length).toBe(3);
            done();
          })
          .catch(catchErrors(done));
        });
      });
    });

    describe('when the reference exists', () => {
      it('should update it', (done) => {
        relationships.getById(connectionID1)
        .then((reference) => {
          reference.entity = 'entity1';
          return relationships.save(reference, 'en');
        })
        .then(([result]) => {
          expect(result.entity).toBe('entity1');
          expect(result._id.equals(connectionID1)).toBe(true);
          done();
        })
        .catch(catchErrors(done));
      });

      it('should update correctly if ID is not a mongo ObjectId', (done) => {
        relationships.getById(connectionID1)
        .then((reference) => {
          reference.entity = 'entity1';
          reference._id = reference._id.toString();
          return relationships.save(reference, 'en');
        })
        .then(([result]) => {
          expect(result.entity).toBe('entity1');
          expect(result._id.equals(connectionID1)).toBe(true);
          done();
        })
        .catch(catchErrors(done));
      });
    });

    describe('when saving one reference without hub', () => {
      it('should throw an error', (done) => {
        relationships.save({entity: 'entity3', range: {text: 'range'}}, 'en')
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
        return relationships.getByDocument('bruceWayne', 'en');
      })
      .then((connections) => {
        expect(connections.length).toBe(4);
        expect(connections.find((connection) => connection.entity === 'bruceWayne')).toBeDefined();
        expect(connections.find((connection) => connection.entity === 'robin')).toBeDefined();
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
      const searchResponse = Promise.resolve({rows: []});
      spyOn(search, 'search').and.returnValue(searchResponse);
      relationships.search('entity2', {filter: {}, searchTerm: 'something'}, 'en')
      .then(() => {
        let actualQuery = search.search.calls.mostRecent().args[0];
        expect(actualQuery.searchTerm).toEqual('something');
        expect(actualQuery.ids).containItems(['doc5', 'doc4', 'entity3', 'entity1']);
        expect(actualQuery.includeUnpublished).toBe(true);
        expect(actualQuery.limit).toBe(9999);
        done();
      })
      .catch(catchErrors(done));
    });

    it('should filter out ids based on filtered relation types and templates', (done) => {
      const searchResponse = Promise.resolve({rows: []});
      spyOn(search, 'search').and.returnValue(searchResponse);
      let query = {filter: {}, searchTerm: 'something'};
      query.filter[relation2] = [relation2 + template];
      relationships.search('entity2', query, 'en')
      .then(() => {
        let actualQuery = search.search.calls.mostRecent().args[0];
        expect(actualQuery.searchTerm).toEqual('something');
        expect(actualQuery.ids).containItems(['doc4', 'entity3']);
        expect(actualQuery.includeUnpublished).toBe(true);
        expect(actualQuery.limit).toBe(9999);
        done();
      })
      .catch(catchErrors(done));
    });

    it('should return the matching entities with their relationships and the current entity with the respective relationships', (done) => {
      const searchResponse = Promise.resolve({rows: [{sharedId: 'entity1'}, {sharedId: 'entity3'}, {sharedId: 'doc4'}, {sharedId: 'doc5'}]});
      spyOn(search, 'search').and.returnValue(searchResponse);
      relationships.search('entity2', {filter: {}, searchTerm: 'something'}, 'en')
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

    it('should retrun number of hubs and allow limiting the number of HUBs returned', (done) => {
      const searchResponse = Promise.resolve({rows: [{sharedId: 'entity1'}, {sharedId: 'entity3'}, {sharedId: 'doc4'}, {sharedId: 'doc5'}]});
      spyOn(search, 'search').and.returnValue(searchResponse);

      relationships.search('entity2', {filter: {}, searchTerm: 'something', limit: 2}, 'en')
      .then((result) => {
        expect(result.totalHubs).toBe(4);
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
    it('should delete the relationship in all languages and dont leave lone connection in the hub', (done) => {
      return relationships.delete({_id: connectionID1}, 'en')
      .then(() => {
        return relationships.get({hub: hub7});
      })
      .then((result) => {
        expect(result).toEqual([]);
        done();
      })
      .catch(catchErrors(done));
    });

    it('should call entities top update the metadata', (done) => {
      relationships.delete({entity: 'bruceWayne'}, 'en')
      .then(() => {
        expect(entities.updateMetdataFromRelationships).toHaveBeenCalledWith(['bruceWayne', 'thomasWayne', 'IHaveNoTemplate'], 'en');
        done();
      });
    });

    it('should delete all the relationships for a given entity', (done) => {
      return relationships.delete({entity: 'entity2'})
      .then(() => {
        return relationships.get({entity: 'entity2'});
      })
      .then((result) => {
        expect(result).toEqual([]);
        done();
      })
      .catch(catchErrors(done));
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
      relationships.deleteTextReferences('entity3', 'en')
      .then(() => {
        return Promise.all([relationships.getByDocument('entity3', 'en'), relationships.getByDocument('entity3', 'ru')]);
      })
      .then(([relationshipsInEnglish, relationshipsInRusian]) => {
        expect(relationshipsInEnglish.length).toBe(5);
        expect(relationshipsInRusian.length).toBe(2);
        done();
      });
    });
  });
});
