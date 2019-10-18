"use strict";var _jasmineHelpers = require("../../../../utils/jasmineHelpers");
var _testing_db = _interopRequireDefault(require("../../../../utils/testing_db"));
var _index = _interopRequireDefault(require("../index.js"));
var _fixtures = _interopRequireWildcard(require("./fixtures.js"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}









describe('migration sync-starting-point', () => {
  let updatelogs;

  const expectLog = id => ({ toBelongTo: namespace => {
      const log = updatelogs.find(l => l.mongoId.toString() === id.toString());
      const expectedOrder = {
        settings: 1,
        dictionaries: 2,
        relationtypes: 2,
        translations: 2,
        templates: 3,
        entities: 4,
        connections: 5 };

      expect(log).toEqual(expect.objectContaining({ namespace, timestamp: expectedOrder[namespace], deleted: false }));
    } });

  beforeEach(done => {
    spyOn(process.stdout, 'write');
    _testing_db.default.clearAllAndLoad(_fixtures.default).then(done).catch((0, _jasmineHelpers.catchErrors)(done));
  });

  afterAll(done => {
    _testing_db.default.disconnect().then(done);
  });

  it('should have a delta number', () => {
    expect(_index.default.delta).toBe(10);
  });

  it('should generate update logs of all the required collections, clearing previous logs', async () => {
    await _index.default.up(_testing_db.default.mongodb);

    updatelogs = await _testing_db.default.mongodb.collection('updatelogs').find().toArray();

    expect(updatelogs.length).toBe(10);
    expectLog(_fixtures.template1).toBelongTo('templates');
    expectLog(_fixtures.template2).toBelongTo('templates');
    expectLog(_fixtures.entity1).toBelongTo('entities');
    expectLog(_fixtures.entity3).toBelongTo('entities');
    expectLog(_fixtures.translation1).toBelongTo('translations');
    expectLog(_fixtures.connection1).toBelongTo('connections');

    expect(updatelogs.find(l => l.mongoId.toString() === _fixtures.migration1.toString())).not.toBeDefined();
  });
});