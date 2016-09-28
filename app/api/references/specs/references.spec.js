import {db_url as dbURL} from 'api/config/database.js';
import references from '../references.js';
import database from 'api/utils/database.js';
import fixtures, {template} from './fixtures.js';
import request from 'shared/JSONRequest';
import {catchErrors} from 'api/utils/jasmineHelpers';

describe('references', () => {
  beforeEach((done) => {
    database.reset_testing_database()
    .then(() => database.import(fixtures))
    .then(done)
    .catch(done.fail);
  });

  describe('getAll()', () => {
    it('should return all the references in the database', (done) => {
      references.getAll()
      .then((result) => {
        expect(result.rows.length).toBe(9);
        expect(result.rows[0].type).toBe('reference');
        expect(result.rows[0].title).toBe('reference1');
        done();
      }).catch(catchErrors(done));
    });
  });

  describe('saveEntityBasedReferences', () => {
    it('should create references for each option on selects/multiselects using entities ' +
       '(not affecting document references or inbound refences)', (done) => {
      const entity = {
        _id: 'id_testing',
        template,
        metadata: {
          selectName: 'selectValue',
          multiSelectName: ['value1', 'value2']
        }
      };

      references.saveEntityBasedReferences(entity)
      .then(() => {
        return references.getByDocument(entity._id);
      })
      .then((refs) => {
        expect(refs.length).toBe(5);

        expect(refs.find((ref) => ref.targetDocument === 'selectValue').sourceDocument).toBe('id_testing');
        expect(refs.find((ref) => ref.targetDocument === 'selectValue').sourceType).toBe('metadata');
        expect(refs.find((ref) => ref.targetDocument === 'value1').sourceDocument).toBe('id_testing');
        expect(refs.filter((ref) => ref.targetDocument === 'value2')[0].sourceDocument).toBe('id_testing');
        expect(refs.filter((ref) => ref.targetDocument === 'value2')[1]._id).toBe('c08ef2532f0bd008ac5174b45e033c10');
        expect(refs.find((ref) => ref.sourceDocument === 'value2')._id).toBe('inbound');

        done();
      })
      .catch(catchErrors(done));
    });

    it('should not attempt to create references for missing properties', (done) => {
      const entity = {
        _id: 'id_testing',
        template,
        metadata: {
          selectName: 'selectValue'
        }
      };

      references.saveEntityBasedReferences(entity)
      .then(() => {
        return references.getByDocument(entity._id);
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
          template,
          metadata: {
            selectName: 'selectValue',
            multiSelectName: ['value1', 'value2']
          }
        };

        let generatedIds = [];
        references.saveEntityBasedReferences(entity)
        .then((createdReferences) => {
          generatedIds.push(createdReferences.find((ref) => ref.targetDocument === 'value1')._id);
          generatedIds.push(createdReferences.find((ref) => ref.targetDocument === 'value2')._id);
          entity.metadata.selectName = 'value1';
          entity.metadata.multiSelectName = ['value2'];
          return references.saveEntityBasedReferences(entity);
        })
        .then(() => {
          return references.getByDocument(entity._id);
        })
        .then((refs) => {
          expect(refs.length).toBe(4);

          expect(refs.find((ref) => ref.targetDocument === 'value1')._id).not.toBe(generatedIds[0]);
          expect(refs.find((ref) => ref.targetDocument === 'value1').sourceDocument).toBe('id_testing');
          expect(refs.filter((ref) => ref.targetDocument === 'value2')[0]._id).toBe(generatedIds[1]);
          expect(refs.filter((ref) => ref.targetDocument === 'value2')[0].sourceDocument).toBe('id_testing');
          expect(refs.filter((ref) => ref.targetDocument === 'value2')[1]._id).toBe('c08ef2532f0bd008ac5174b45e033c10');

          done();
        })
        .catch(catchErrors(done));
      });
    });
  });

  describe('getByDocument()', () => {
    it('should return all the references of a document', (done) => {
      references.getByDocument('source2')
      .then((result) => {
        expect(result.length).toBe(4);

        expect(result[0].inbound).toBe(true);
        expect(result[0].targetDocument).toBe('source2');
        expect(result[0].range).toBe('range1');
        expect(result[0].text).toBe('sourceRange');
        expect(result[0].connectedDocument).toBe('source1');
        expect(result[0].connectedDocumentTitle).toBe('source1 title');
        expect(result[0].connectedDocumentType).toBe('document');
        expect(result[0].connectedDocumentTemplate).toBe('template3_id');
        expect(result[0].connectedDocumentPublished).toBe(false);

        expect(result[1].inbound).toBe(false);
        expect(result[1].sourceDocument).toBe('source2');
        expect(result[1].range).toBe('range2');
        expect(result[1].text).toBe('targetRange');
        expect(result[1].connectedDocument).toBe('doc3');
        expect(result[1].connectedDocumentTitle).toBe('doc3 title');
        expect(result[1].connectedDocumentType).toBe('entity');
        expect(result[1].connectedDocumentTemplate).toBe('template1_id');
        expect(result[1].connectedDocumentPublished).toBe(true);

        expect(result[2].inbound).toBe(false);
        expect(result[2].sourceDocument).toBe('source2');
        expect(result[2].range).toBe('range3');
        expect(result[2].text).toBe('');
        expect(result[2].connectedDocument).toBe('doc4');
        expect(result[2].connectedDocumentTitle).toBe('doc4 title');
        expect(result[2].connectedDocumentType).toBe('document');
        expect(result[2].connectedDocumentTemplate).toBe('template1_id');
        expect(result[2].connectedDocumentPublished).toBe(false);

        expect(result[3].text).toBe('');
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
        references.save({sourceDocument: 'sourceDoc', targetDocument: 'doc3', sourceRange: 'range', targetRange: {text: 'text'}})
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
          return references.save(reference);
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
});
