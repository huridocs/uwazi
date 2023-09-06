import { ObjectId } from 'mongodb';
import { MongoIdHandler } from '../MongoIdGenerator';

describe('MongoIdGenerator', () => {
  describe('generate', () => {
    it('should generate a string id', () => {
      expect(MongoIdHandler.generate()).toEqual(expect.any(String));
    });
  });

  describe('mapToDb', () => {
    it('should map a string id to a Mongo ObjectId', () => {
      const id = MongoIdHandler.generate();
      expect(MongoIdHandler.mapToDb(id)).toEqual(expect.any(ObjectId));
    });
  });

  describe('mapToApp', () => {
    it('should map a Mongo ObjectId to a string', () => {
      const id = MongoIdHandler.generate();
      expect(MongoIdHandler.mapToApp(MongoIdHandler.mapToDb(id))).toEqual(id);
    });
  });
});
