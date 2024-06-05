import {
  ActivityLogFilter,
  ActivityLogQueryTime,
  bodyCondition,
  prepareToFromRanges,
} from '../activityLogFilter';

describe('activityLogFilter', () => {
  describe('prepareToFromRanges', () => {
    it.each`
      from          | to            | expected
      ${null}       | ${1000011600} | ${{ $lt: 1000098000000 }}
      ${1000011600} | ${1000011600} | ${{ $gte: 1000011600000, $lt: 1000098000000 }}
      ${1000011600} | ${null}       | ${{ $gte: 1000011600000 }}
      ${1000011600} | ${1500008400} | ${{ $gte: 1000011600000, $lt: 1500094800000 }}
    `("should create a date condition from: '$from' to: '$to' ", ({ from, to, expected }) => {
      const timeCondition: ActivityLogQueryTime = { from, to };
      const result = prepareToFromRanges(timeCondition);
      expect(result).toEqual(expected);
    });
  });

  describe('bodyCondition', () => {
    it.each([
      {
        methods: ['UPDATE'],
        condition: [
          { $and: [{ method: 'POST' }, { body: { $regex: '^({"_id").*' } }] },
          { $and: [{ method: 'PUT' }, { body: { $regex: '^({"_id").*' } }] },
        ],
      },
      {
        methods: ['CREATE'],
        condition: [{ $and: [{ method: 'POST' }, { body: { $regex: '^(?!{"_id").*' } }] }],
      },
      {
        methods: ['DELETE'],
        condition: [{ $and: [{ method: 'DELETE' }, { body: { $regex: '^({"_id").*' } }] }],
      },
      {
        methods: ['MIGRATE'],
        condition: [{ method: 'MIGRATE' }],
      },
      {
        methods: ['MIGRATE', 'DELETE', 'POST'],
        condition: [
          { method: 'MIGRATE' },
          { $and: [{ method: 'DELETE' }, { body: { $regex: '^({"_id").*' } }] },
          { method: 'POST' },
        ],
      },
    ])(
      'should check the presence/absence of _id in body for each method',
      ({ methods, condition }) => {
        const result = bodyCondition(methods);
        expect(result).toEqual(condition);
      }
    );
  });

  describe('ActivityLogFilter', () => {
    describe('searchFilter', () => {
      it('should build a query for semantic search', () => {
        const filters = new ActivityLogFilter({ search: 'new user' });
        const query = filters.prepareQuery();
        expect(query).toEqual({
          $and: [
            {
              url: {
                $regex: '^\\/api\\/users\\/new$',
              },
            },
            {
              method: 'POST',
            },
          ],
        });
      });
      it('should build a query for semantic search', () => {
        const filters = new ActivityLogFilter({ search: 'new user' });
        const query = filters.prepareQuery();
        expect(query).toEqual({
          $and: [
            {
              url: {
                $regex: '^\\/api\\/users\\/new$',
              },
            },
            {
              method: 'POST',
            },
          ],
        });
      });
      it('should build an open query when there is not semantic matches', () => {
        const filters = new ActivityLogFilter({ search: 'other content' });
        const query = filters.prepareQuery();
        expect(query).toEqual({
          $or: [
            {
              method: {
                $regex: 'OTHER CONTENT',
              },
            },
            {
              url: {
                $regex: '^other content$',
              },
            },
            {
              query: {
                $regex: '.*other content.*',
                $options: 'si',
              },
            },
            {
              body: {
                $regex: '.*other content.*',
                $options: 'si',
              },
            },
            {
              params: {
                $regex: '.*other content.*',
                $options: 'si',
              },
            },
          ],
        });
      });
    });

    it('should build complex queries', () => {
      const filters = new ActivityLogFilter({
        username: 'admin',
        search: 'Imported',
        time: { from: 1000011600 },
      });
      const query = filters.prepareQuery();
      expect(query).toEqual({
        $and: [
          {
            $or: [
              {
                $or: [
                  {
                    $and: [
                      {
                        url: {
                          $regex: '^\\/api\\/import$',
                        },
                      },
                      {
                        method: 'POST',
                      },
                    ],
                  },
                  {
                    $and: [
                      {
                        url: {
                          $regex: '^\\/api\\/translations\\/import$',
                        },
                      },
                      {
                        method: 'POST',
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            $or: [
              {
                username: {
                  $regex: '.*admin.*',
                  $options: 'si',
                },
              },
            ],
          },
          {
            time: {
              $gte: 1000011600000,
            },
          },
        ],
      });
    });
  });
});
