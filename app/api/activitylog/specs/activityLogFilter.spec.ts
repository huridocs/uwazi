import {
  ActivityLogFilter,
  ActivityLogQueryTime,
  bodyCondition,
  prepareToFromRanges,
} from '../activityLogFilter';

describe('activityLogFilter', () => {
  describe('prepareToFromRanges', () => {
    it.each`
      from             | to               | expected
      ${undefined}     | ${1000011600000} | ${{ $lt: 1000098000000 }}
      ${1000011600000} | ${1000011600000} | ${{ $gte: 1000011600000, $lt: 1000098000000 }}
      ${1000011600000} | ${undefined}     | ${{ $gte: 1000011600000 }}
      ${1000011600000} | ${1500008400000} | ${{ $gte: 1000011600000, $lt: 1500094800000 }}
    `("should create a date condition from: '$from' to: '$to' ", ({ from, to, expected }) => {
      const timeCondition: ActivityLogQueryTime = { from, to };
      const result = prepareToFromRanges(timeCondition);
      expect(result).toEqual(expected);
    });
  });

  describe('bodyCondition', () => {
    it('should check for no _id when searching by CREATE', () => {
      const result = bodyCondition(['CREATE']);
      expect(result).toEqual([
        {
          $and: [
            {
              $and: [
                {
                  method: 'POST',
                },
                {
                  body: {
                    $regex: '^(?!{"_id").*',
                  },
                },
              ],
            },
            {
              $and: [
                {
                  method: 'POST',
                },
                {
                  body: {
                    $regex: '^(?!{"entity":"{\\\\"_id).*',
                  },
                },
              ],
            },
          ],
        },
      ]);
    });
    it('should check for _id when searching by UPDATE', () => {
      const result = bodyCondition(['UPDATE']);
      expect(result).toEqual([
        {
          $and: [
            {
              method: 'POST',
            },
            {
              body: {
                $regex: '^({"_id").*',
              },
            },
          ],
        },
        {
          $and: [
            {
              method: 'POST',
            },
            {
              body: {
                $regex: '^({"entity":"{\\\\"_id).*',
              },
            },
          ],
        },
        {
          $and: [
            {
              method: 'PUT',
            },
            {
              body: {
                $regex: '^({"_id").*',
              },
            },
          ],
        },
        {
          $and: [
            {
              method: 'PUT',
            },
            {
              body: {
                $regex: '^({"entity":"{\\\\"_id).*',
              },
            },
          ],
        },
      ]);
    });
    it('should check for _id in query when searching by DELETE', () => {
      const result = bodyCondition(['DELETE']);
      expect(result).toEqual([
        {
          $and: [
            {
              method: 'DELETE',
            },
            {
              body: {
                $regex: '^({"_id").*',
              },
            },
          ],
        },
        {
          $and: [
            {
              method: 'DELETE',
            },
            {
              query: {
                $regex: '^({"_id").*',
              },
            },
          ],
        },
        {
          $and: [
            {
              method: 'DELETE',
            },
            {
              query: {
                $regex: '^({"sharedId").*',
              },
            },
          ],
        },
      ]);
    });
    it('should only check for method MIGRATE', () => {
      const result = bodyCondition(['MIGRATE']);
      expect(result).toEqual([
        {
          method: 'MIGRATE',
        },
      ]);
    });
    it('should combine conditions for several methods', () => {
      const result = bodyCondition(['MIGRATE', 'DELETE', 'POST']);
      expect(result).toEqual([
        {
          method: 'MIGRATE',
        },
        {
          $and: [
            {
              method: 'DELETE',
            },
            {
              body: {
                $regex: '^({"_id").*',
              },
            },
          ],
        },
        {
          $and: [
            {
              method: 'DELETE',
            },
            {
              query: {
                $regex: '^({"_id").*',
              },
            },
          ],
        },
        {
          $and: [
            {
              method: 'DELETE',
            },
            {
              query: {
                $regex: '^({"sharedId").*',
              },
            },
          ],
        },
        {
          method: 'POST',
        },
      ]);
    });
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
              $gte: 1000011600,
            },
          },
        ],
      });
    });
  });
});
