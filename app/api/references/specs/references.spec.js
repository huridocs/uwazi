/* eslint-disable max-nested-callbacks */
import references from '../references.js';
import connectionsModel from '../connectionsModel.js';
import {catchErrors} from 'api/utils/jasmineHelpers';

import db from 'api/utils/testing_db';
import fixtures, {template, selectValueID, value1ID, value2ID, connectionID1, hub1} from './fixtures.js';
import {inbound, templateChangingNames, templateWithoutProperties, relation4} from './fixtures.js';
import fixturesForGroup, {template1Id, template2Id, template3Id, relation1, relation2} from './fixturesForGroup';

fdescribe('references', () => {
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

  describe('saveEntityBasedReferences', () => {
    describe('when entity has no template', () => {
      it('should return a resolved promise', (done) => {
        const entity = {_id: 'id_testing'};
        references.saveEntityBasedReferences(entity)
        .then((refs) => {
          expect(refs).toEqual([]);
          done();
        })
        .catch(() => {
          done.fail('should not failt when entity has no template');
        });
      });
    });

    it('should create references for each option on selects/multiselects using entities ' +
    '(not affecting document references or inbound refences)', (done) => {
      const entity = {
        _id: 'id_testing',
        sharedId: 'entity_id',
        template,
        metadata: {
          selectName: selectValueID,
          multiSelectName: [value1ID, value2ID]
        }
      };

      references.saveEntityBasedReferences(entity, 'es')
      .then(() => {
        return references.getByDocument(entity.sharedId, 'es');
      })
      .then((refs) => {
        expect(refs.length).toBe(8);

        expect(refs.find((ref) => ref.targetDocument === selectValueID).sourceDocument).toBe('entity_id');
        expect(refs.find((ref) => ref.targetDocument === selectValueID).sourceType).toBe('metadata');
        expect(refs.find((ref) => ref.targetDocument === selectValueID).sourceTemplate.toString()).toBe(template.toString());
        expect(refs.find((ref) => ref.targetDocument === value1ID).sourceDocument).toBe('entity_id');
        expect(refs.find((ref) => ref.targetDocument === value2ID && ref.sourceType === 'metadata').sourceDocument).toBe('entity_id');
        expect(refs.find((ref) => ref.targetDocument === value2ID && !ref.sourceType)._id.toString()).toBe(connectionID1.toString());
        expect(refs.find((ref) => ref.sourceDocument === value2ID)._id.toString()).toBe(inbound.toString());

        done();
      })
      .catch(catchErrors(done));
    });

    it('should not attempt to create references for missing properties', (done) => {
      const entity = {
        _id: 'id_testing',
        sharedId: 'entity_id',
        template,
        metadata: {
          selectName: selectValueID
        }
      };

      references.saveEntityBasedReferences(entity, 'es')
      .then(() => {
        return references.getByDocument(entity.sharedId, 'es');
      })
      .then((refs) => {
        expect(refs.length).toBe(3);
        done();
      })
      .catch(catchErrors(done));
    });

    describe('when a select value changes', () => {
      it('should update the references properly', (done) => {
        const entity = {
          _id: 'id_testing',
          sharedId: 'entity_id',
          template,
          metadata: {
            selectName: selectValueID,
            multiSelectName: [value1ID, value2ID]
          }
        };

        let generatedIds = [];
        references.saveEntityBasedReferences(entity, 'es')
        .then((createdReferences) => {
          generatedIds.push(createdReferences.find((ref) => ref.targetDocument === value1ID)._id);
          generatedIds.push(createdReferences.find((ref) => ref.targetDocument === value2ID)._id);
          entity.metadata.selectName = value1ID;
          entity.metadata.multiSelectName = [value2ID];
          return references.saveEntityBasedReferences(entity, 'es');
        })
        .then(() => {
          return references.getByDocument(entity.sharedId, 'es');
        })
        .then((refs) => {
          expect(refs.length).toBe(4);

          expect(refs.find((ref) => ref.targetDocument === value1ID)._id).not.toBe(generatedIds[0]);
          expect(refs.find((ref) => ref.targetDocument === value1ID).sourceDocument).toBe('entity_id');
          expect(refs.find((ref) => ref.targetDocument === value2ID && ref.sourceType === 'metadata')._id.toString())
          .toBe(generatedIds[1].toString());
          expect(refs.find((ref) => ref.targetDocument === value2ID && ref.sourceType === 'metadata').sourceDocument).toBe('entity_id');
          expect(refs.find((ref) => ref.targetDocument === value2ID && !ref.sourceType)._id.toString()).toBe(connectionID1.toString());

          done();
        })
        .catch(catchErrors(done));
      });
    });
  });

  describe('getByDocument()', () => {
    it('should return all the references of a document', (done) => {
      references.getByDocument('source2', 'es')
      .then((result) => {
        expect(result.length).toBe(8);

        const source1Connection = result.find((connection) => connection.entity === 'source1');
        expect(source1Connection.range).toEqual({text: 'sourceRange'});
        expect(source1Connection.connectedDocumentTitle).toBe('source1 title');
        expect(source1Connection.connectedDocumentIcon).toBe('icon1');
        expect(source1Connection.connectedDocumentType).toBe('document');
        expect(source1Connection.connectedDocumentTemplate).toBe('template3_id');
        expect(source1Connection.connectedDocumentPublished).toBe(false);
        expect(source1Connection.connectedDocumentMetadata).toEqual({data: 'data1'});
        expect(source1Connection.connectedDocumentCreationDate).toEqual(123);
        expect(source1Connection.connectedDocumentFile).toEqual({language: 'spa'});

        const doc3Connection = result.find((connection) => connection.entity === 'doc3');
        expect(doc3Connection.range).toEqual({text: 'targetRange'});
        expect(doc3Connection.connectedDocumentTitle).toBe('doc3 title');
        expect(doc3Connection.connectedDocumentIcon).toBe('icon3');
        expect(doc3Connection.connectedDocumentType).toBe('entity');
        expect(doc3Connection.connectedDocumentTemplate).toBe('template1_id');
        expect(doc3Connection.connectedDocumentPublished).toBe(true);
        expect(doc3Connection.connectedDocumentMetadata).toEqual({data: 'data2'});
        expect(doc3Connection.connectedDocumentCreationDate).toEqual(456);
        expect(doc3Connection.connectedDocumentFile).toBeUndefined();

        done();
      })
      .catch(catchErrors(done));
    });
  });

  describe('getGroupsByConnection()', () => {
    beforeEach((done) => {
      db.clearAllAndLoad(fixturesForGroup, (err) => {
        if (err) {
          done.fail(err);
        }
        done();
      });
    });

    it('should return groups of connection types and templates of all the references of a document', (done) => {
      references.getGroupsByConnection('source2', 'es')
      .then(results => {
        expect(results.length).toBe(3);

        expect(results[0].key).toBe(relation1.toString());
        expect(results[0].connectionType).toBe('connection');
        expect(results[0].connectionLabel).toBe('relation 1');
        expect(results[0].context).toBe(relation1.toString());
        expect(results[0].templates.length).toBe(3);

        expect(results[0].templates[0]._id.toString()).toBe(template3Id.toString());
        expect(results[0].templates[0].label).toBe('template 3');
        expect(results[0].templates[1]._id.toString()).toBe(template2Id.toString());
        expect(results[0].templates[1].label).toBe('template 2');
        expect(results[0].templates[1].count).toBe(1);
        expect(results[0].templates[1].refs[0].title).toBe('reference4');
        expect(results[0].templates[1].refs[0].connectedDocumentTemplate.toString()).toBe(template2Id.toString());

        expect(results[1].key).toBe(relation2.toString());
        expect(results[1].connectionType).toBe('connection');
        expect(results[1].connectionLabel).toBe('relation 2');
        expect(results[1].context).toBe(relation2.toString());
        expect(results[1].templates.length).toBe(1);

        expect(results[1].templates[0].count).toBe(2);
        expect(results[1].templates[0].refs[0].title).toBe('reference3');
        expect(results[1].templates[0].refs[1].title).toBe('reference5');

        expect(results[2].key).toBe('selectName');
        expect(results[2].connectionType).toBe('metadata');
        expect(results[2].connectionLabel).toBe('Select Name');
        expect(results[2].context).toBe(template1Id.toString());
        expect(results[2].templates.length).toBe(1);

        expect(results[2].templates[0]._id.toString()).toBe(template1Id.toString());

        done();
      })
      .catch(catchErrors(done));
    });

    it('should return groups of connection including unpublished docs if user is found', (done) => {
      references.getGroupsByConnection('source2', 'es', {user: 'found'})
      .then(results => {
        expect(results.length).toBe(3);

        expect(results[0].key).toBe(relation1.toString());
        expect(results[0].templates[0]._id.toString()).toBe(template3Id.toString());

        expect(results[1].key).toBe(relation2.toString());
        expect(results[1].templates[0].count).toBe(3);

        expect(results[2].key).toBe('selectName');
        expect(results[2].templates[0]._id.toString()).toBe(template1Id.toString());

        done();
      })
      .catch(catchErrors(done));
    });

    it('should return groups of connection wihtout refs if excluded', (done) => {
      references.getGroupsByConnection('source2', 'es', {excludeRefs: true})
      .then(results => {
        expect(results.length).toBe(3);
        expect(results[0].templates[1].refs).toBeUndefined();
        expect(results[1].templates[0].refs).toBeUndefined();

        done();
      })
      .catch(catchErrors(done));
    });
  });

  describe('getByTarget()', () => {
    it('should return all the references with specific target document', (done) => {
      references.getByTarget('target')
      .then((result) => {
        expect(result.length).toBe(2);
        expect(result[0].targetDocument).toBe('target');
        expect(result[1].targetDocument).toBe('target');
        done();
      }).catch(catchErrors(done));
    });
  });

  describe('countByRelationType()', () => {
    it('should return number of references using a relationType', (done) => {
      references.countByRelationType(relation4.toString())
      .then((result) => {
        expect(result).toBe(2);
        done();
      }).catch(catchErrors(done));
    });

    it('should return zero when none is using it', (done) => {
      const not_used_relation = db.id().toString();
      references.countByRelationType(not_used_relation)
      .then((result) => {
        expect(result).toBe(0);
        done();
      }).catch(catchErrors(done));
    });
  });

  fdescribe('save()', () => {
    describe('When creating a new reference to a hub', () => {
      it('should save it and return it with the entity data', (done) => {
        references.save({entity: 'doc3', range: {text: 'range'}, hub: hub1}, 'es')
        .then(([result]) => {
          expect(result.entity).toBe('doc3');
          expect(result.entityData.template).toBe('template1_id');
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
          expect(doc3Connection.entityData.template).toBe('template1_id');
          expect(doc3Connection.entityData.type).toBe('entity');
          expect(doc3Connection.entityData.title).toBe('doc3 title');
          expect(doc3Connection.entityData.published).toBe(true);

          expect(doc3Connection._id).toBeDefined();
          expect(doc3Connection.hub).toBeDefined();

          expect(doc4Connection.entity).toBe('doc4');
          expect(doc4Connection.entityData.template).toBe('template1_id');
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

  describe('delete()', () => {
    it('should delete the reference', (done) => {
      return references.delete(connectionID1)
      .then(() => {
        return references.getById(connectionID1);
      })
      .then((result) => {
        expect(result).toBe(null);
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
        expect(results.length).toBe(3);
        expect(results.filter(r => r.sourceDocument === 'source2').length).toBe(1);
        expect(results.filter(r => r.sourceDocument === 'source2')[0].language).toBe('en');
        done();
      });
    });
  });

  describe('updateMetadataConnections', () => {
    it('should not throw when passed template has no properties', (done) => {
      spyOn(connectionsModel.db, 'updateMany');
      const changedTemplateWithoutProperties = {_id: templateChangingNames};
      references.updateMetadataConnections(changedTemplateWithoutProperties)
      .then(() => {
        done('this is only to check that do not throw an error');
      })
      .catch((e) => {
        done.fail('should not fail', e);
      });
    });

    it('should not throw when old template', (done) => {
      spyOn(connectionsModel.db, 'updateMany');
      const changedTemplateWithoutProperties = {_id: templateWithoutProperties, properties: []};
      references.updateMetadataConnections(changedTemplateWithoutProperties)
      .then(() => {
        done('this is only to check that do not throw an error');
      })
      .catch((e) => {
        done.fail('should not fail', e);
      });
    });

    it('should do nothing when there is no changed or deleted properties', (done) => {
      spyOn(connectionsModel.db, 'updateMany');
      const unchangedTemplate = {_id: templateChangingNames, properties: [
        {id: '1', type: 'text', name: 'property1'},
        {id: '2', type: 'text', name: 'property2'},
        {id: '3', type: 'text', name: 'property3'},
        {type: 'text', label: 'new property'}
      ]};

      references.updateMetadataConnections(unchangedTemplate)
      .then(() => {
        expect(connectionsModel.db.updateMany).not.toHaveBeenCalled();
        done();
      })
      .catch(catchErrors(done));
    });

    it('should update sourceProperty on all connections with the previous one and belonging to the template', (done) => {
      const changedTemplate = {_id: templateChangingNames, properties: [
        {id: '1', type: 'text', name: 'new_name1'},
        {id: '2', type: 'text', name: 'new_name2'},
        {id: '3', type: 'text', name: 'property3'}
      ]};

      references.updateMetadataConnections(changedTemplate)
      .then(() => references.get({sourceType: 'metadata'}))
      .then((metadataReferences) => {
        expect(metadataReferences.length).toBe(5);
        expect(metadataReferences.filter((r) => r.sourceProperty === 'new_name1').length).toBe(2);
        expect(metadataReferences.filter((r) => r.sourceProperty === 'new_name2').length).toBe(1);
        expect(metadataReferences.filter((r) => r.sourceProperty === 'property3').length).toBe(1);
        expect(metadataReferences.filter((r) => r.sourceProperty === 'selectName').length).toBe(1);
        done();
      })
      .catch(catchErrors(done));
    });

    it('should delete connections of removed properties', (done) => {
      const changedTemplate = {_id: templateChangingNames, properties: [
        {id: '2', type: 'text', name: 'new_name2'}
      ]};

      references.updateMetadataConnections(changedTemplate)
      .then(() => references.get({sourceType: 'metadata'}))
      .then((metadataReferences) => {
        expect(metadataReferences.length).toBe(2);
        expect(metadataReferences.filter((r) => r.sourceProperty === 'property1').length).toBe(0);
        expect(metadataReferences.filter((r) => r.sourceProperty === 'new_name2').length).toBe(1);
        expect(metadataReferences.filter((r) => r.sourceProperty === 'property3').length).toBe(0);
        expect(metadataReferences.filter((r) => r.sourceProperty === 'selectName').length).toBe(1);
        done();
      })
      .catch(catchErrors(done));
    });
  });
});
