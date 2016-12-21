import {db_url as dbURL} from 'api/config/database.js';
import documents from '../documents.js';
import database from 'api/utils/database.js';
import fixtures from './fixtures.js';
import request from 'shared/JSONRequest';
import {catchErrors} from 'api/utils/jasmineHelpers';
import date from 'api/utils/date.js';
import fs from 'fs';
import {mockID} from 'shared/uniqueID';
import references from 'api/references';
import entities from 'api/entities';
import search from 'api/search/search';

describe('documents', () => {
  beforeEach((done) => {
    spyOn(references, 'saveEntityBasedReferences').and.returnValue(Promise.resolve());
    spyOn(search, 'index').and.returnValue(Promise.resolve());
    mockID();
    database.reset_testing_database()
    .then(() => database.import(fixtures))
    .then(done)
    .catch(catchErrors(done));
  });

  describe('get', () => {
    describe('when passing id', () => {
      it('should return matching document', (done) => {
        Promise.all([
          documents.get('id', 'es'),
          documents.get('id', 'en')
        ])
        .then(([docEs, docEn]) => {
          expect(docEs.rows[0].title).toBe('Penguin almost done');
          expect(docEs.rows[0].fullText).not.toBeDefined();
          expect(docEn.rows[0].title).toBe('Penguin almost done english');
          done();
        })
        .catch(done.fail);
      });
    });
  });

  describe('save', () => {
    let getDocuments = () => request.get(dbURL + '/_design/documents/_view/all').then((response) => response.json.rows.map(r => r.value));
    //let getDocument = (id = '8202c463d6158af8065022d9b5014ccb') => request.get(dbURL + `/${id}`).then((response) => response.json);

    it('should call entities.save', (done) => {
      spyOn(entities, 'save').and.returnValue(Promise.resolve('result'));
      let doc = {title: 'Batman begins'};
      let user = {_id: 'user Id'};
      let language = 'es';

      documents.save(doc, {user, language})
      .then((docs) => {
        expect(entities.save).toHaveBeenCalledWith(doc, {user, language});
        expect(docs).toBe('result');
        done();
      })
      .catch(catchErrors(done));
    });

    it('should assign unique ids to toc entries', (done) => {
      spyOn(date, 'currentUTC').and.returnValue('universal time');
      let doc = {title: 'Batman begins', toc: [{}, {_id: '1'}]};
      let user = {_id: 'user Id'};

      documents.save(doc, user)
      .then(getDocuments)
      .then((docs) => {
        let createdDocument = docs.find((d) => d.title === 'Batman begins');
        expect(createdDocument.toc[0]._id).toBe('unique_id');
        expect(createdDocument.toc[1]._id).toBe('1');
        done();
      })
      .catch(catchErrors(done));
    });
  });

  //describe('countByTemplate', () => {
    //it('should return how many documents using the template passed', (done) => {
      //documents.countByTemplate('template1')
      //.then((count) => {
        //expect(count).toBe(2);
        //done();
      //})
      //.catch(done.fail);
    //});

    //it('should return 0 when no count found', (done) => {
      //documents.countByTemplate('newTemplate')
      //.then((count) => {
        //expect(count).toBe(0);
        //done();
      //})
      //.catch(done.fail);
    //});
  //});

  describe('getUploadsByUser', () => {
    it('should request all unpublished documents for the user', (done) => {
      let user = {_id: 'c08ef2532f0bd008ac5174b45e033c94'};
      documents.getUploadsByUser(user)
      .then((response) => {
        expect(response.rows.length).toBe(1);
        expect(response.rows[0].title).toBe('unpublished');
        expect(response.rows[0]._id).toBe('d0298a48d1221c5ceb53c4879301508f');
        done();
      })
      .catch(catchErrors(done));
    });
  });

  describe('delete', () => {
    beforeEach(() => {
      fs.writeFileSync('./uploaded_documents/8202c463d6158af8065022d9b5014ccb.pdf');
      fs.writeFileSync('./uploaded_documents/8202c463d6158af8065022d9b5014cc1.pdf');
    });

    it('should delete the document in the database', (done) => {
      request.get(`${dbURL}/8202c463d6158af8065022d9b5014ccb`)
      .then((response) => {
        return documents.delete(response.json.sharedId);
      })
      .then(() => {
        return request.get(`${dbURL}/8202c463d6158af8065022d9b5014ccb`);
      })
      .then(done.fail)
      .catch((error) => {
        expect(error.json.error).toBe('not_found');
        expect(error.json.reason).toBe('deleted');
        done();
      });
    });

    it('should delete the original file', (done) => {
      documents.delete('id')
      .then(() => {
        expect(fs.existsSync('./uploaded_documents/8202c463d6158af8065022d9b5014ccb.pdf')).toBe(false);
        expect(fs.existsSync('./uploaded_documents/8202c463d6158af8065022d9b5014cc1.pdf')).toBe(false);
        done();
      })
      .catch(done.fail);
    });
  });
});
