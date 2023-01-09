import { config } from 'api/config';
import testingDB from 'api/utils/testing_db';

import fixtures from './fixtures.js';
import migration from '../index.js';

describe('migration fullText_to_per_page', () => {
  beforeEach(async () => {
    jest.spyOn(process.stdout, 'write').mockImplementation(() => {});
    config.defaultTenant.uploadedDocuments = __dirname;
    await testingDB.clearAllAndLoad(fixtures);
  });

  afterAll(async () => {
    await testingDB.disconnect();
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(3);
  });

  // eslint-disable-next-line max-statements
  it('should migrate properly', async () => {
    await migration.up(testingDB.mongodb);
    const entities = await testingDB.mongodb.collection('entities').find().toArray();

    const doc1 = entities.find(e => e.title === 'doc1');
    expect(doc1.fullText[1]).toMatch('This[[1]]');
    expect(doc1.fullText[2]).toMatch('Is[[2]]');
    expect(doc1.fullText[2]).toMatch('The[[2]] new[[2]]');
    expect(doc1.fullText[3]).toMatch('fullText[[3]]');
    expect(doc1.totalPages).toBe(3);

    const doc2 = entities.find(e => e.title === 'doc2');
    expect(doc2.fullText[1]).toMatch('This');
    expect(doc2.fullText[2]).toMatch('Is[[2]]');
    expect(doc2.fullText[2]).toMatch('The[[2]] new[[2]]');
    expect(doc2.fullText[3]).toMatch('fullText');
    expect(doc2.totalPages).toBe(3);

    const doc7 = entities.find(e => e.title === 'doc7');
    expect(doc7.fullText[1]).toMatch('This');
    expect(doc7.fullText[2]).toMatch('Is[[2]]');
    expect(doc7.fullText[2]).toMatch('The[[2]] new[[2]]');
    expect(doc7.fullText[3]).toMatch('fullText');
    expect(doc7.totalPages).toBe(3);
  });
});
