"use strict";var _paths = _interopRequireDefault(require("../../../../config/paths"));
var _testing_db = _interopRequireDefault(require("../../../../utils/testing_db"));

var _fixtures = _interopRequireDefault(require("./fixtures.js"));
var _index = _interopRequireDefault(require("../index.js"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('migration fullText_to_per_page', () => {
  beforeEach(async () => {
    spyOn(process.stdout, 'write');
    _paths.default.uploadedDocuments = __dirname;
    await _testing_db.default.clearAllAndLoad(_fixtures.default);
  });

  afterAll(async () => {
    await _testing_db.default.disconnect();
  });

  it('should have a delta number', () => {
    expect(_index.default.delta).toBe(3);
  });

  it('should migrate properly', async () => {
    await _index.default.up(_testing_db.default.mongodb);
    const entities = await _testing_db.default.mongodb.collection('entities').find().toArray();

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