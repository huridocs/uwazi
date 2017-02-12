import {db_url as dbURL} from 'api/config/database.js';
import references from '../references.js';
import database from 'api/utils/database.js';
import request from 'shared/JSONRequest';
import {catchErrors} from 'api/utils/jasmineHelpers';

import {db} from 'api/utils';
import fixtures, {template, selectValueID, value1ID, value2ID, sourceDocument, inbound} from './fixtures.js';

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
    fit('should return all the references', (done) => {
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
      fit('should return a resolved promise', (done) => {
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

    fit('should create references for each option on selects/multiselects using entities ' +
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
          selectName: 'selectValueID'
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
            selectName: 'selectValueID',
            multiSelectName: ['value1ID', 'value2ID']
          }
        };

        let generatedIds = [];
        references.saveEntityBasedReferences(entity, 'es')
        .then((createdReferences) => {
          generatedIds.push(createdReferences.find((ref) => ref.targetDocument === 'value1ID')._id);
          generatedIds.push(createdReferences.find((ref) => ref.targetDocument === 'value2ID')._id);
          entity.metadata.selectName = 'value1ID';
          entity.metadata.multiSelectName = ['value2ID'];
          return references.saveEntityBasedReferences(entity, 'es');
        })
        .then(() => {
          return references.getByDocument(entity.sharedId, 'es');
        })
        .then((refs) => {
          expect(refs.length).toBe(4);

          expect(refs.find((ref) => ref.targetDocument === 'value1ID')._id).not.toBe(generatedIds[0]);
          expect(refs.find((ref) => ref.targetDocument === 'value1ID').sourceDocument).toBe('entity_id');
          expect(refs.find((ref) => ref.targetDocument === 'value2ID' && ref.sourceType === 'metadata')._id).toBe(generatedIds[1]);
          expect(refs.find((ref) => ref.targetDocument === 'value2ID' && ref.sourceType === 'metadata').sourceDocument).toBe('entity_id');
          expect(refs.find((ref) => ref.targetDocument === 'value2ID' && !ref.sourceType)._id).toBe('c08ef2532f0bd008ac5174b45e033c10');

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

        expect(result[3].text).toBe('');
        expect(result[3].connectedDocumentMetadata).toEqual({});
        expect(result[3].connectedDocumentCreationDate).toBeUndefined();
        done();
      })
      .catch(catchErrors(done));
    });
  });

  describe('getByTarget()', () => {
    it('should return all the references with specific target document', (done) => {
      references.getByTarget('target')
      .then((result) => {
        expect(result.rows.length).toBe(2);
        expect(result.rows[0].targetDocument).toBe('target');
        expect(result.rows[1].targetDocument).toBe('target');
        done();
      }).catch(catchErrors(done));
    });
  });

  describe('countByRelationType()', () => {
    it('should return number of references using a relationType', (done) => {
      references.countByRelationType('relation2')
      .then((result) => {
        expect(result).toBe(2);
        done();
      }).catch(catchErrors(done));
    });

    it('should return zero when none is using it', (done) => {
      references.countByRelationType('not_used_relation')
      .then((result) => {
        expect(result).toBe(0);
        done();
      }).catch(catchErrors(done));
    });
  });

  describe('save()', () => {
    describe('when the reference did not exist', () => {
      it('should create a new outbound connection and return it normalized by sourceDocument', (done) => {
        references.save({sourceDocument: 'sourceDoc', targetDocument: 'doc3', sourceRange: 'range', targetRange: {text: 'text'}}, 'es')
        .then((result) => {
          expect(result.sourceDocument).toBe('sourceDoc');
          expect(result.connectedDocument).toBe('doc3');
          expect(result.connectedDocumentTemplate).toBe('template1_id');
          expect(result.connectedDocumentType).toBe('entity');
          expect(result.connectedDocumentTitle).toBe('doc3 title');
          expect(result.connectedDocumentPublished).toBe(true);
          expect(result.range).toBe('range');
          expect(result.text).toBe('text');
          expect(result.inbound).toBe(false);

          expect(result._id).toBeDefined();
          expect(result._rev).toBeDefined();
          done();
        })
        .catch(catchErrors(done));
      });
    });

    describe('when the reference exists', () => {
      it('should update it', (done) => {
        let previousRev;
        request.get(`${dbURL}/c08ef2532f0bd008ac5174b45e033c01`)
        .then((result) => {
          let reference = result.json;
          reference.sourceDocument = 'source1';
          previousRev = reference._rev;
          return references.save(reference, 'es');
        })
        .then((result) => {
          expect(result.sourceDocument).toBe('source1');
          expect(result._id).toBe('c08ef2532f0bd008ac5174b45e033c01');
          expect(result._rev !== previousRev).toBe(true);
          done();
        }).catch(catchErrors(done));
      });
    });
  });

  describe('delete()', () => {
    it('should delete the reference', (done) => {
      request.get(`${dbURL}/c08ef2532f0bd008ac5174b45e033c00`)
      .then((result) => {
        return references.delete(result.json);
      })
      .then(() => {
        return request.get(`${dbURL}/c08ef2532f0bd008ac5174b45e033c00`);
      })
      .catch((result) => {
        expect(result.json.error).toBe('not_found');
        expect(result.json.reason).toBe('deleted');
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
        expect(results.filter(r => r._id === 'c08ef2532f0bd008ac5174b45e033c03').length).toBe(0);
        done();
      });
    });
  });
});
