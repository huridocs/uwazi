/* eslint-disable max-nested-callbacks */
import references from '../references.js';
import {catchErrors} from 'api/utils/jasmineHelpers';

import db from 'api/utils/testing_db';
import fixtures, {connectionID1, hub1, hub7} from './fixtures.js';
import {relation3, relation4, template} from './fixtures.js';

describe('references', () => {
  beforeEach((done) => {
    db.clearAllAndLoad(fixtures, (err) => {
      if (err) {
        done.fail(err);
      }
      done();
    });
  });

  describe('get()', () => {
    it('should return all the references', (done) => {
      references.get()
      .then((result) => {
        expect(result.length).toBe(15);
        done();
      }).catch(catchErrors(done));
    });
  });

  describe('getByDocument()', () => {
    it('should return all the references of a document', (done) => {
      references.getByDocument('source2', 'es')
      .then((result) => {
        expect(result.length).toBe(8);
        const source1Connection = result.find((connection) => connection.entity === 'source1');
        expect(source1Connection.range).toEqual({text: 'sourceRange'});
        expect(source1Connection.entityData.title).toBe('source1 title');
        expect(source1Connection.entityData.icon).toBe('icon1');
        expect(source1Connection.entityData.type).toBe('document');
        expect(source1Connection.entityData.template).toEqual(template);
        expect(source1Connection.entityData.metadata).toEqual({data: 'data1'});
        expect(source1Connection.entityData.creationDate).toEqual(123);
        expect(source1Connection.entityData.file).toEqual({language: 'spa'});

        const doc3Connection = result.find((connection) => connection.entity === 'doc3');
        expect(doc3Connection.range).toEqual({text: 'targetRange'});
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
    it('should return groups of connection types and templates of all the references of a document', (done) => {
      references.getGroupsByConnection('source2', 'es')
      .then(results => {
        expect(results.length).toBe(2);

        expect(results[0].key).toBe(relation4.toString());
        expect(results[0].connectionType).toBe('connection');
        expect(results[0].connectionLabel).toBe('relation 2');
        expect(results[0].context).toBe(relation4.toString());
        expect(results[0].templates.length).toBe(1);

        expect(results[0].templates[0]._id.toString()).toBe(template.toString());
        expect(results[0].templates[0].label).toBe('template');

        expect(results[1].key).toBe(relation3.toString());
        expect(results[1].connectionType).toBe('connection');
        expect(results[1].connectionLabel).toBe('relation 1');
        expect(results[1].context).toBe(relation3.toString());
        expect(results[1].templates.length).toBe(1);

        expect(results[1].templates[0].count).toBe(1);

        done();
      })
      .catch(catchErrors(done));
    });

    it('should return groups of connection including unpublished docs if user is found', (done) => {
      references.getGroupsByConnection('source2', 'es', {user: 'found'})
      .then(results => {
        expect(results.length).toBe(3);

        expect(results[0].key).toBe(relation3.toString());
        expect(results[0].templates[0]._id.toString()).toBe(template.toString());

        expect(results[1].key).toBe(relation4.toString());
        expect(results[1].templates[0].count).toBe(4);

        expect(results[2].key).toBe('selectName');
        expect(results[2].templates[0]._id.toString()).toBe(template.toString());

        done();
      })
      .catch(catchErrors(done));
    });

    it('should return groups of connection wihtout refs if excluded', (done) => {
      references.getGroupsByConnection('source2', 'es', {excludeRefs: true})
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
      references.getHub(hub1)
      .then((result) => {
        expect(result.length).toBe(2);
        expect(result[0].entity).toBe('source1');
        expect(result[1].entity).toBe('source2');
        done();
      }).catch(catchErrors(done));
    });
  });

  describe('countByRelationType()', () => {
    it('should return number of references using a relationType', (done) => {
      references.countByRelationType(relation4.toString())
      .then((result) => {
        expect(result).toBe(4);
        done();
      }).catch(catchErrors(done));
    });

    it('should return zero when none is using it', (done) => {
      const notUsedRelation = db.id().toString();
      references.countByRelationType(notUsedRelation)
      .then((result) => {
        expect(result).toBe(0);
        done();
      }).catch(catchErrors(done));
    });
  });

  describe('save()', () => {
    describe('When creating a new reference to a hub', () => {
      it('should save it and return it with the entity data', (done) => {
        references.save({entity: 'doc3', range: {text: 'range'}, hub: hub1}, 'es')
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

    describe('When creating new references', () => {
      it('should assign them a hub and return them with the entity data', (done) => {
        references.save([{entity: 'doc3'}, {entity: 'doc4'}], 'es')
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
    });

    describe('when the reference exists', () => {
      it('should update it', (done) => {
        references.getById(connectionID1)
        .then((reference) => {
          reference.entity = 'source1';
          return references.save(reference, 'es');
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
        references.save({entity: 'doc3', range: {text: 'range'}}, 'es')
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
        sharedId: 'saveEntityBasedReferencesTestEntity',
        metadata: {
          selectName: 'source1'
        }
      };

      references.saveEntityBasedReferences(entity, 'es')
      .then(() => {
        return references.getByDocument('saveEntityBasedReferencesTestEntity');
      })
      .then((connections) => {
        expect(connections.length).toBe(2);
        expect(connections.find((connection) => connection.entity === 'source1')).toBeDefined();
        expect(connections.find((connection) => connection.entity === 'saveEntityBasedReferencesTestEntity')).toBeDefined();
        expect(connections[0].hub).toEqual(connections[1].hub);
        done();
      });
    });

    it('should not create existing connections based on properties', (done) => {
      const entity = {
        template: template.toString(),
        sharedId: 'source1',
        metadata: {
          selectName: 'source2'
        }
      };

      references.saveEntityBasedReferences(entity, 'es')
      .then(() => {
        return references.getByDocument('source1');
      })
      .then((connections) => {
        expect(connections.length).toBe(2);
        done();
      });
    });

    it('should delete connections based on properties', (done) => {
      const entity = {
        template: template.toString(),
        sharedId: 'saveEntityBasedReferencesTestEntity',
        metadata: {
          selectName: 'source1'
        }
      };

      references.saveEntityBasedReferences(entity, 'es')
      .then(() => {
        return references.getByDocument('saveEntityBasedReferencesTestEntity');
      })
      .then((connections) => {
        expect(connections.length).toBe(2);
        entity.metadata = {};
        return references.saveEntityBasedReferences(entity, 'es');
      })
      .then(() => {
        return references.getByDocument('saveEntityBasedReferencesTestEntity');
      })
      .then((connections) => {
        expect(connections.length).toBe(0);
        done();
      });
    });
  });

  describe('delete()', () => {
    it('should delete the reference and dont leave lone connection in the hub', (done) => {
      return references.delete(connectionID1)
      .then(() => {
        return references.getHub(hub7);
      })
      .then((result) => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should delete all the ereferences for complex conditions', (done) => {
      return references.delete({entity: 'source2'})
      .then(() => {
        return references.getByDocument('source2');
      })
      .then((result) => {
        expect(result).toEqual([]);
        done();
      });
    });
  });

  describe('deleteTextReferences()', () => {
    it('should delete the entity text references (that match language)', (done) => {
      references.deleteTextReferences('source2', 'es')
      .then(() => {
        return references.getByDocument('source2', 'es');
      })
      .then(results => {
        expect(results.length).toBe(6);
        done();
      });
    });
  });
});
