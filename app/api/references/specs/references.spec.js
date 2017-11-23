/* eslint-disable max-nested-callbacks */
import references from '../references.js';
import connectionsModel from '../connectionsModel.js';
import {catchErrors} from 'api/utils/jasmineHelpers';

import db from 'api/utils/testing_db';
import fixtures, {template, selectValueID, value1ID, value2ID, sourceDocument} from './fixtures.js';
import {inbound, templateChangingNames, templateWithoutProperties, relation3, relation4} from './fixtures.js';
import fixturesForGroup, {template1Id, template2Id, template3Id, relation1, relation2} from './fixturesForGroup';

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
        expect(result.length).toBe(9);
        expect(result[0].title).toBe('reference1');
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
        expect(refs.length).toBe(5);

        expect(refs.find((ref) => ref.targetDocument === selectValueID).sourceDocument).toBe('entity_id');
        expect(refs.find((ref) => ref.targetDocument === selectValueID).sourceType).toBe('metadata');
        expect(refs.find((ref) => ref.targetDocument === selectValueID).sourceTemplate.toString()).toBe(template.toString());
        expect(refs.find((ref) => ref.targetDocument === value1ID).sourceDocument).toBe('entity_id');
        expect(refs.find((ref) => ref.targetDocument === value2ID && ref.sourceType === 'metadata').sourceDocument).toBe('entity_id');
        expect(refs.find((ref) => ref.targetDocument === value2ID && !ref.sourceType)._id.toString()).toBe(sourceDocument.toString());
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
          expect(refs.find((ref) => ref.targetDocument === value2ID && !ref.sourceType)._id.toString()).toBe(sourceDocument.toString());

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
        expect(result.length).toBe(4);

        expect(result[0].inbound).toBe(true);
        expect(result[0].targetDocument).toBe('source2');
        expect(result[0].range).toEqual({for: 'range1', text: ''});
        expect(result[0].text).toBe('sourceRange');
        expect(result[0].connectedDocument).toBe('source1');
        expect(result[0].connectedDocumentTitle).toBe('source1 title');
        expect(result[0].connectedDocumentIcon).toBe('icon1');
        expect(result[0].connectedDocumentType).toBe('document');
        expect(result[0].connectedDocumentTemplate).toBe('template3_id');
        expect(result[0].connectedDocumentPublished).toBe(false);
        expect(result[0].connectedDocumentMetadata).toEqual({data: 'data1'});
        expect(result[0].connectedDocumentCreationDate).toEqual(123);
        expect(result[0].connectedDocumentFile).toEqual({language: 'spa'});

        expect(result[1].inbound).toBe(false);
        expect(result[1].sourceDocument).toBe('source2');
        expect(result[1].range).toEqual({for: 'range2', text: 'range2'});
        expect(result[1].text).toBe('targetRange');
        expect(result[1].connectedDocument).toBe('doc3');
        expect(result[1].connectedDocumentTitle).toBe('doc3 title');
        expect(result[1].connectedDocumentIcon).toBe('icon3');
        expect(result[1].connectedDocumentType).toBe('entity');
        expect(result[1].connectedDocumentTemplate).toBe('template1_id');
        expect(result[1].connectedDocumentPublished).toBe(true);
        expect(result[1].connectedDocumentMetadata).toEqual({data: 'data2'});
        expect(result[1].connectedDocumentCreationDate).toEqual(456);
        expect(result[1].connectedDocumentFile).toBeUndefined();

        expect(result[2].inbound).toBe(false);
        expect(result[2].sourceDocument).toBe('source2');
        expect(result[2].range).toEqual({for: 'range3', text: 'range3'});
        expect(result[2].text).toBe('');
        expect(result[2].connectedDocument).toBe('doc4');
        expect(result[2].connectedDocumentTitle).toBe('doc4 title');
        expect(result[2].connectedDocumentType).toBe('document');
        expect(result[2].connectedDocumentTemplate).toBe('template1_id');
        expect(result[2].connectedDocumentPublished).toBe(false);
        expect(result[2].connectedDocumentMetadata).toEqual({data: 'data3'});
        expect(result[2].connectedDocumentCreationDate).toEqual(789);
        expect(result[2].connectedDocumentFile).toEqual({language: 'eng'});

        expect(result[3].text).toBe('');
        expect(result[3].connectedDocumentMetadata).toEqual({});
        expect(result[3].connectedDocumentCreationDate).toBeUndefined();
        expect(result[3].connectedDocumentFile).toBeUndefined();
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

  describe('save()', () => {
    describe('when the reference did not exist', () => {
      it('should create a new outbound connection and return it normalized by sourceDocument', (done) => {
        references.save({sourceDocument: 'sourceDoc', targetDocument: 'doc3', sourceRange: {text: 'range'}, targetRange: {text: 'text'}}, 'es')
        .then((result) => {
          expect(result.sourceDocument).toBe('sourceDoc');
          expect(result.connectedDocument).toBe('doc3');
          expect(result.connectedDocumentTemplate).toBe('template1_id');
          expect(result.connectedDocumentType).toBe('entity');
          expect(result.connectedDocumentTitle).toBe('doc3 title');
          expect(result.connectedDocumentPublished).toBe(true);
          expect(result.range).toEqual({text: 'range'});
          expect(result.text).toBe('text');
          expect(result.inbound).toBe(false);

          expect(result._id).toBeDefined();
          done();
        })
        .catch(catchErrors(done));
      });
    });

    describe('when the reference exists', () => {
      it('should update it', (done) => {
        references.getById(sourceDocument)
        .then((reference) => {
          reference.sourceDocument = 'source1';
          return references.save(reference, 'es');
        })
        .then((result) => {
          expect(result.sourceDocument).toBe('source1');
          expect(result._id.equals(sourceDocument)).toBe(true);
          done();
        })
        .catch(catchErrors(done));
      });
    });
  });

  describe('delete()', () => {
    it('should delete the reference', (done) => {
      return references.delete(sourceDocument)
      .then(() => {
        return references.getById(sourceDocument);
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
