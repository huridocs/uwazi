/* eslint-disable max-classes-per-file */
import { DomainError } from '../DomainError.js';
import { NotFoundError } from '../NotFoundError.js';
import { ConflictError } from '../ConflictError.js';
import { AJVObject, ValidationError } from '../ValidationError.js';

class PlainError extends DomainError {
  constructor() {
    super('plain', 'test.plain');
  }
}

class MissingThing extends NotFoundError {
  constructor() {
    super('missing', 'test.missing');
  }
}

class DuplicatedThing extends ConflictError {
  constructor() {
    super('duplicated', 'test.duplicated');
  }
}

class InvalidThing extends ValidationError {
  constructor() {
    super('invalid', 'test.invalid');
  }

  asAJV(): AJVObject {
    return { message: this.message, keyword: 'invalidThing' };
  }
}

describe('DomainError categories', () => {
  it.each([
    [new PlainError(), 'rule_violation'],
    [new MissingThing(), 'not_found'],
    [new DuplicatedThing(), 'conflict'],
    [new InvalidThing(), 'validation'],
  ])('should categorise %s', (error, category) => {
    expect(error).toBeInstanceOf(DomainError);
    expect(error.category).toBe(category);
  });

  it('should include the category in asObject()', () => {
    expect(new DuplicatedThing().asObject()).toMatchObject({
      name: 'DuplicatedThing',
      code: 'test.duplicated',
      category: 'conflict',
      message: 'duplicated',
    });
  });

  it('should not add the category as an own enumerable property', () => {
    expect(Object.keys(new MissingThing())).not.toContain('category');
  });
});
