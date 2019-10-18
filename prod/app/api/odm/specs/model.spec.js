"use strict";var _mongoose = _interopRequireDefault(require("mongoose"));
var _updatelogs = require("../../updatelogs");
var _testing_db = _interopRequireDefault(require("../../utils/testing_db"));
var _model = _interopRequireDefault(require("../model"));
var _models = _interopRequireDefault(require("../models"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function ownKeys(object, enumerableOnly) {var keys = Object.keys(object);if (Object.getOwnPropertySymbols) {keys.push.apply(keys, Object.getOwnPropertySymbols(object));}if (enumerableOnly) keys = keys.filter(function (sym) {return Object.getOwnPropertyDescriptor(object, sym).enumerable;});return keys;}function _objectSpread(target) {for (var i = 1; i < arguments.length; i++) {if (i % 2) {var source = arguments[i] != null ? arguments[i] : {};ownKeys(source, true).forEach(function (key) {_defineProperty(target, key, source[key]);});} else if (Object.getOwnPropertyDescriptors) {Object.defineProperties(target, Object.getOwnPropertyDescriptors(arguments[i]));} else {ownKeys(source).forEach(function (key) {Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(arguments[i], key));});}}return target;}function _defineProperty(obj, key, value) {if (key in obj) {Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });} else {obj[key] = value;}return obj;}

const testSchema = new _mongoose.default.Schema({
  name: String });


describe('ODM Model', () => {
  const originalDatenow = Date.now;

  beforeEach(async () => {
    await _testing_db.default.clearAllAndLoad({});
  });

  afterAll(async () => {
    Date.now = originalDatenow;
    await _testing_db.default.disconnect();
  });

  it('should register all the models to the requirable models hashmap', () => {
    expect(_models.default).toEqual({});
    const model1 = (0, _model.default)('tempSchema', testSchema);
    const model2 = (0, _model.default)('anotherSchema', new _mongoose.default.Schema({ name: String }));

    expect(_models.default.tempSchema).toBe(model1);
    expect(_models.default.anotherSchema).toBe(model2);
  });

  describe('Save', () => {
    it('should be able to create when passing an _id and it does not exists', async () => {
      const extendedModel = (0, _model.default)('tempSchema', testSchema);
      const id = _testing_db.default.id();
      await extendedModel.save({ _id: id, name: 'document 1' });
      const [createdDocument] = await extendedModel.get({ _id: id });
      expect(createdDocument).toBeDefined();
    });
  });

  describe('Logging functionality', () => {
    let extendedModel;
    let newDocument1;
    let newDocument2;

    beforeEach(async () => {
      Date.now = () => 1;
      extendedModel = (0, _model.default)('tempSchema', testSchema);
      newDocument1 = await extendedModel.save({ name: 'document 1' });
      newDocument2 = await extendedModel.save({ name: 'document 2' });
    });

    it('should extend create a log entry when saving', async () => {
      const [logEntry1] = await _updatelogs.model.find({ mongoId: newDocument1._id });
      const [logEntry2] = await _updatelogs.model.find({ mongoId: newDocument2._id });
      expect(logEntry1.timestamp).toBe(1);
      expect(logEntry1.namespace).toBe('tempSchema');
      expect(logEntry2.timestamp).toBe(1);
    });

    it('should update the log when updating (not creating a new entry)', async () => {
      Date.now = () => 2;
      await extendedModel.save(_objectSpread({}, newDocument1, { name: 'edited name' }));
      const logEntries = await _updatelogs.model.find({});
      expect(logEntries.length).toBe(2);
      expect(logEntries.find(e => e.mongoId.toString() === newDocument1._id.toString()).timestamp).toBe(2);
    });

    it('should intercept updateMany', async () => {
      const newDocument3 = await extendedModel.save({ name: 'document 3' });
      Date.now = () => 3;
      await extendedModel.db.updateMany({ _id: { $in: [newDocument1._id, newDocument2._id] } }, { $set: { name: 'same name' } });
      const logEntries = await _updatelogs.model.find({});
      expect(logEntries.length).toBe(3);
      expect(logEntries.find(e => e.mongoId.toString() === newDocument1._id.toString()).timestamp).toBe(3);
      expect(logEntries.find(e => e.mongoId.toString() === newDocument2._id.toString()).timestamp).toBe(3);
      expect(logEntries.find(e => e.mongoId.toString() === newDocument3._id.toString()).timestamp).toBe(1);
    });

    describe('delete', () => {
      beforeEach(() => {
        Date.now = () => 4;
      });

      it('should intercept model delete', async () => {
        await extendedModel.delete({ _id: newDocument2._id });
        const logEntries = await _updatelogs.model.find({});

        expect(logEntries.length).toBe(2);

        expect(logEntries.find(e => e.mongoId.toString() === newDocument1._id.toString()).timestamp).toBe(1);

        const document2Log = logEntries.find(e => e.mongoId.toString() === newDocument2._id.toString());
        expect(document2Log.timestamp).toBe(4);
        expect(document2Log.deleted).toBe(true);
      });

      it('should not add undefined affected ids, it would cause deletion of entire collections', async () => {
        await extendedModel.delete({ hub: 'non existent' });

        const logEntries = await _updatelogs.model.find({});
        const undefinedIdLog = logEntries.find(e => !e.mongoId);
        expect(undefinedIdLog).not.toBeDefined();
      });

      it('should intercept model delete with id as string', async () => {
        await extendedModel.delete(newDocument2._id.toString());
        const logEntries = await _updatelogs.model.find({});

        expect(logEntries.length).toBe(2);

        expect(logEntries.find(e => e.mongoId.toString() === newDocument1._id.toString()).timestamp).toBe(1);

        const document2Log = logEntries.find(e => e.mongoId.toString() === newDocument2._id.toString());
        expect(document2Log.timestamp).toBe(4);
        expect(document2Log.deleted).toBe(true);
      });
    });
  });
});