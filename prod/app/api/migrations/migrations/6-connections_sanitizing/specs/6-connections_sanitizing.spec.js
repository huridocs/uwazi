"use strict";var _jasmineHelpers = require("../../../../utils/jasmineHelpers");
var _testing_db = _interopRequireDefault(require("../../../../utils/testing_db"));
var _index = _interopRequireDefault(require("../index.js"));
var _fixtures = _interopRequireWildcard(require("./fixtures.js"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('migration connections_sanitizing', () => {
  beforeEach(done => {
    spyOn(process.stdout, 'write');
    _testing_db.default.clearAllAndLoad(_fixtures.default).then(done).catch((0, _jasmineHelpers.catchErrors)(done));
  });

  afterAll(done => {
    _testing_db.default.disconnect().then(done);
  });

  it('should have a delta number', () => {
    expect(_index.default.delta).toBe(6);
  });

  describe('Migration logic', () => {
    let migratedConnections;

    beforeEach(async () => {
      await _index.default.up(_testing_db.default.mongodb);
      migratedConnections = await _testing_db.default.mongodb.collection('connections').find().toArray();
    });

    it('should keep all connections present in all languages', async () => {
      expect(migratedConnections.filter(c => c.hub.toString() === _fixtures.hub1).length).toBe(6);
      expect(migratedConnections.filter(c => c.sharedId.toString() === _fixtures.shared1).length).toBe(3);
      expect(migratedConnections.filter(c => c.sharedId.toString() === _fixtures.shared5).length).toBe(3);
    });

    it('should keep correcly formed text connections (even if not in all languages)', async () => {
      expect(migratedConnections.filter(c => c.sharedId.toString() === _fixtures.shared4).length).toBe(2);
    });

    it('should delete incomplete connections', async () => {
      expect(migratedConnections.filter(c => c.sharedId.toString() === _fixtures.shared2).length).toBe(0);
      expect(migratedConnections.filter(c => c.sharedId.toString() === _fixtures.shared3).length).toBe(0);
    });

    it('should delete hubs that have only 1 connection, even if correctly conformed', async () => {
      expect(migratedConnections.filter(c => c.hub.toString() === _fixtures.hub3).length).toBe(0);
    });
  });
});