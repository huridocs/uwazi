import { MongoIdHandler } from '#api/core/infrastructure/mongodb/common/MongoIdGenerator.js';
import { IdSchema, IdListQuerySchema } from '../Id.js';

describe('IdSchema', () => {
  it('should accept a generated id', () => {
    expect(IdSchema.parse(MongoIdHandler.generate())).toEqual(expect.any(String));
  });

  it.each([
    ['not-an-id', 'a non hex string'],
    ['65098dea0bbc8851518bd53', 'a 23 character hex string'],
    ['65098dea0bbc8851518bd53cc', 'a 25 character hex string'],
    ['', 'an empty string'],
  ])('should reject %s (%s)', id => {
    expect(() => IdSchema.parse(id)).toThrow();
  });
});

describe('IdListQuerySchema', () => {
  const first = '65098dea0bbc8851518bd53c';
  const second = '65098dea0bbc8851518bd53d';

  it('should parse a JSON array string', () => {
    expect(IdListQuerySchema.parse(`["${first}","${second}"]`)).toEqual([first, second]);
  });

  it('should wrap a single id in an array', () => {
    expect(IdListQuerySchema.parse(first)).toEqual([first]);
  });

  it('should pass an array of ids through', () => {
    expect(IdListQuerySchema.parse([first, second])).toEqual([first, second]);
  });

  it('should reject a malformed JSON array', () => {
    expect(() => IdListQuerySchema.parse(`["${first}"`)).toThrow();
  });

  it('should reject a list containing an invalid id', () => {
    expect(() => IdListQuerySchema.parse(`["${first}","not-an-id"]`)).toThrow();
  });
});
