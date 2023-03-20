import { validateNewRelationshipQueryInput } from '../propertyValidators';

const correctTraverseQueryInput1 = {
  direction: 'in',
  types: ['type'],
  match: [],
};

const correctTraverseQueryInput2 = {
  direction: 'in',
  types: ['type'],
  match: [
    {
      templates: ['template'],
    },
  ],
};

const correctTraverseQueryInput3 = {
  direction: 'in',
  types: ['type'],
  match: [
    {
      templates: ['template'],
      traverse: [correctTraverseQueryInput2],
    },
  ],
};

describe('validateNewRelationshipQueryInput', () => {
  it.each([
    {
      input: undefined,
    },
    {
      input: ['wrong'],
    },
    {
      input: [
        {
          ...correctTraverseQueryInput1,
          direction: undefined,
        },
      ],
    },
    {
      input: [
        {
          ...correctTraverseQueryInput1,
          direction: 'invalid',
        },
      ],
    },
    {
      input: [
        {
          ...correctTraverseQueryInput1,
          types: undefined,
        },
      ],
    },
    {
      input: [
        {
          ...correctTraverseQueryInput1,
          types: [0],
        },
      ],
    },
    {
      input: [
        {
          ...correctTraverseQueryInput1,
          types: ['type', 0],
        },
      ],
    },
    {
      input: [
        {
          ...correctTraverseQueryInput1,
          match: undefined,
        },
      ],
    },
    {
      input: [
        {
          ...correctTraverseQueryInput1,
          match: [0],
        },
      ],
    },
    {
      input: [
        {
          ...correctTraverseQueryInput2,
          match: [{}],
        },
      ],
    },
    {
      input: [
        {
          ...correctTraverseQueryInput2,
          match: [{ templates: [0] }],
        },
      ],
    },
    {
      input: [
        {
          ...correctTraverseQueryInput2,
          match: [{ templates: ['template', 0] }],
        },
      ],
    },
    {
      input: [
        {
          ...correctTraverseQueryInput3,
          match: [
            {
              templates: ['template'],
              traverse: [0],
            },
          ],
        },
      ],
    },
    {
      input: [
        {
          ...correctTraverseQueryInput3,
          match: [
            {
              templates: ['template'],
              traverse: [0],
            },
          ],
        },
      ],
    },
  ])('should return false if the input is not valid', ({ input }) => {
    expect(validateNewRelationshipQueryInput(input)).toBe(false);
  });

  it.each([
    {
      input: [
        {
          ...correctTraverseQueryInput1,
        },
      ],
    },
    {
      input: [
        {
          ...correctTraverseQueryInput2,
        },
      ],
    },
    {
      input: [
        {
          ...correctTraverseQueryInput3,
        },
      ],
    },
  ])('should return true if the input is valid', ({ input }) => {
    expect(validateNewRelationshipQueryInput(input)).toBe(true);
  });
});
