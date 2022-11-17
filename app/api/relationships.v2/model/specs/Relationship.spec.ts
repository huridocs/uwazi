import { SelfReferenceError } from 'api/relationships.v2/errors/relationshipErrors';
import { EntityPointer, Relationship, TextReferencePointer, Selection } from '../Relationship';

describe('SelectionRectangle', () => {
  it.each([
    { top: -1, left: 0, height: 1, width: 1, comment: 'negative top' },
    { top: 0, left: -1, height: 1, width: 1, comment: 'negative left' },
    { top: 0, left: 0, height: 0, width: 1, comment: 'no height' },
    { top: 0, left: 0, height: 1, width: 0, comment: 'no width' },
    { top: -1, left: -1, height: -1, width: -1, comment: 'several problems' },
  ])('should fail if the rectangle has $comment', async ({ top, left, height, width }) => {
    try {
      const selection = new Selection(1, top, left, height, width);
      fail(`${selection} should fail if properties are invalid`);
    } catch (e) {
      await expect(e.message).toMatch(/top|left|height|width/);
    }
  });

  it('should fail the rectangle is in a non-positive page', async () => {
    try {
      const selection = new Selection(0, 1, 1, 1, 1);
      fail(`${selection} should fail if the page is non-positive`);
    } catch (e) {
      await expect(e.message).toMatch(/page/i);
    }
  });
});

describe('Pointer', () => {
  describe('when comparing for equality', () => {
    it.each([
      {
        comment: 'point to the same entity',
        left: new EntityPointer('entity1'),
        right: new EntityPointer('entity1'),
        result: true,
      },
      {
        comment: 'point to different entities',
        left: new EntityPointer('entity1'),
        right: new EntityPointer('entity2'),
        result: false,
      },
      {
        comment: 'are of different subtypes',
        left: new EntityPointer('entity1'),
        right: new TextReferencePointer('entity1', 'file1', [new Selection(1, 2, 3, 4, 5)], 'text'),
        result: false,
      },
      {
        comment: 'are both TextReferences',
        left: new TextReferencePointer('entity1', 'file1', [new Selection(1, 2, 3, 4, 5)], 'text'),
        right: new TextReferencePointer('entity1', 'file1', [new Selection(1, 2, 3, 4, 5)], 'text'),
        result: false,
      },
    ])('should return $result when the pointers $comment', ({ left, right, result }) => {
      expect(left.equals(right)).toBe(result);
    });
  });

  describe('TextReferencePointer', () => {
    it('should fail if no selection rectangles are provided', async () => {
      try {
        const textReference = new TextReferencePointer('entity1', 'file1', [], 'text');
        fail(`${textReference} should fail if instantiated without rectangles`);
      } catch (e) {
        await expect(e.message).toMatch(/selection/);
      }
    });
  });
});

describe('Relationship', () => {
  describe('When trying to create a self-referencing relationship', () => {
    it('should throw a validation error', () => {
      try {
        const relationship = new Relationship(
          '_id',
          new EntityPointer('entity1'),
          new EntityPointer('entity1'),
          'type1'
        );
        fail(`${relationship} instantiation should have throw error`);
      } catch (e) {
        expect(e).toBeInstanceOf(SelfReferenceError);
      }
    });
  });
});
