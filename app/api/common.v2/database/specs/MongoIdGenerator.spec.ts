import { ObjectId } from 'mongodb';
import { MongoIdHandler } from '../MongoIdGenerator';

const testIdString = '65098dea0bbc8851518bd53c';

const testId = new ObjectId(testIdString);

describe('MongoIdGenerator', () => {
  describe('generate', () => {
    it('should generate a string id', () => {
      expect(MongoIdHandler.generate()).toEqual(expect.any(String));
    });
  });

  describe('mapToDb', () => {
    it('should map a string id to a Mongo ObjectId', () => {
      expect(MongoIdHandler.mapToDb(testIdString)).toEqual(testId);
    });
  });

  describe('mapToApp', () => {
    it('should map a Mongo ObjectId to a string', () => {
      expect(MongoIdHandler.mapToApp(testId)).toEqual(testIdString);
    });
  });
});
