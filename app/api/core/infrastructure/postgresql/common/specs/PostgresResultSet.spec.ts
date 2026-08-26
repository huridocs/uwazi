/* eslint-disable no-await-in-loop */
import { PostgresResultSet } from '../PostgresResultSet.js';

type TestRow = { _id: string; name: string };

const testRows: TestRow[] = [
  { _id: '1', name: 'doc1' },
  { _id: '2', name: 'doc2' },
  { _id: '3', name: 'doc3' },
  { _id: '4', name: 'doc4' },
  { _id: '5', name: 'doc5' },
  { _id: '6', name: 'doc6' },
];

/**
 * Stands in for the async generator produced by PostgresTable.stream().
 * The finally block runs when the generator is fully drained OR when the
 * consumer calls return() early — mirroring the commit/rollback lifecycle
 * of the real stream.
 */
async function* makeIterator(
  rows: TestRow[],
  onFinished?: () => void
): AsyncGenerator<TestRow, void, unknown> {
  try {
    for (const row of rows) {
      yield row;
    }
  } finally {
    if (onFinished) {
      onFinished();
    }
  }
}

const buildIterator = (rows: TestRow[] = testRows, onFinished?: () => void) =>
  makeIterator(rows, onFinished);

describe('PostgresResultSet', () => {
  describe('all()', () => {
    it('should return all results and release the stream', async () => {
      let finished = false;
      const resultSet = new PostgresResultSet(
        buildIterator(testRows, () => {
          finished = true;
        }),
        row => row.name
      );
      expect(await resultSet.all()).toEqual(['doc1', 'doc2', 'doc3', 'doc4', 'doc5', 'doc6']);
      expect(finished).toBe(true);
    });

    it('should use the mapper function', async () => {
      const resultSet = new PostgresResultSet(buildIterator(), row => row.name);
      expect(await resultSet.all()).toEqual(testRows.map(row => row.name));
    });

    it('should support async mappers', async () => {
      const resultSet = new PostgresResultSet(buildIterator(), async row => row.name.toUpperCase());
      expect(await resultSet.all()).toEqual(testRows.map(row => row.name.toUpperCase()));
    });

    it('should return an empty array for an empty stream', async () => {
      const resultSet = new PostgresResultSet(buildIterator([]), row => row.name);
      expect(await resultSet.all()).toEqual([]);
    });
  });

  describe('first()', () => {
    it('should return the first item and close the stream early', async () => {
      let finished = false;
      const resultSet = new PostgresResultSet(
        buildIterator(testRows, () => {
          finished = true;
        }),
        row => row.name
      );
      expect(await resultSet.first()).toEqual('doc1');
      expect(finished).toBe(true); // closed early via return()
    });

    it('should return null for an empty stream', async () => {
      const resultSet = new PostgresResultSet(buildIterator([]), row => row.name);
      expect(await resultSet.first()).toBe(null);
    });
  });

  describe('forEach()', () => {
    it('should visit every item', async () => {
      let finished = false;
      const resultSet = new PostgresResultSet(
        buildIterator(testRows, () => {
          finished = true;
        }),
        row => row.name
      );
      const visited: string[] = [];
      await resultSet.forEach(item => {
        visited.push(item);
      });
      expect(visited).toEqual(['doc1', 'doc2', 'doc3', 'doc4', 'doc5', 'doc6']);
      expect(finished).toBe(true);
    });

    it('should break when the callback returns false and close the stream', async () => {
      let finished = false;
      const resultSet = new PostgresResultSet(
        buildIterator(testRows, () => {
          finished = true;
        }),
        row => row.name
      );
      const visited: string[] = [];
      await resultSet.forEach(item => {
        visited.push(item);
        if (item === 'doc2') {
          return false;
        }
      });
      expect(visited).toEqual(['doc1', 'doc2']);
      expect(finished).toBe(true); // broken loop → close() → generator returned
    });
  });

  describe('forEachBatch()', () => {
    it('should visit items in batches', async () => {
      let finished = false;
      const resultSet = new PostgresResultSet(
        buildIterator(testRows, () => {
          finished = true;
        }),
        row => row.name
      );
      const visited: string[][] = [];
      await resultSet.forEachBatch(4, batch => {
        visited.push(batch);
      });
      expect(visited).toEqual([
        ['doc1', 'doc2', 'doc3', 'doc4'],
        ['doc5', 'doc6'],
      ]);
      expect(finished).toBe(true);
    });

    it('should break when the callback returns false and close the stream', async () => {
      let finished = false;
      const resultSet = new PostgresResultSet(
        buildIterator(testRows, () => {
          finished = true;
        }),
        row => row.name
      );
      const visited: string[][] = [];
      await resultSet.forEachBatch(2, batch => {
        visited.push(batch);
        if (batch[0] === 'doc3') {
          return false;
        }
      });
      expect(visited).toEqual([
        ['doc1', 'doc2'],
        ['doc3', 'doc4'],
      ]);
      expect(finished).toBe(true);
    });
  });

  describe('find()', () => {
    it('should return the first item matching the predicate', async () => {
      const resultSet = new PostgresResultSet(buildIterator(), row => row.name);
      expect(await resultSet.find(item => item.startsWith('doc3'))).toBe('doc3');
    });

    it('should support async predicates', async () => {
      const resultSet = new PostgresResultSet(buildIterator(), row => row.name);
      expect(await resultSet.find(async item => item.startsWith('doc4'))).toBe('doc4');
    });

    it('should return null when nothing matches', async () => {
      const resultSet = new PostgresResultSet(buildIterator(), row => row.name);
      expect(await resultSet.find(item => item.startsWith('nope'))).toBe(null);
    });
  });

  describe('every()', () => {
    it('should be true when the predicate holds for every item', async () => {
      const resultSet = new PostgresResultSet(buildIterator(), row => row.name);
      expect(await resultSet.every(item => item.startsWith('doc'))).toBe(true);
    });

    it('should be false when the predicate fails for some item', async () => {
      const resultSet = new PostgresResultSet(buildIterator(), row => row.name);
      expect(await resultSet.every(item => item.startsWith('doc1'))).toBe(false);
    });

    it('should be true when there are no items', async () => {
      const resultSet = new PostgresResultSet(buildIterator([]), row => row.name);
      expect(await resultSet.every(item => item.startsWith('doc'))).toBe(true);
    });
  });

  describe('some()', () => {
    it('should be true when at least one item matches', async () => {
      const resultSet = new PostgresResultSet(buildIterator(), row => row.name);
      expect(await resultSet.some(item => item === 'doc3')).toBe(true);
    });

    it('should be false when no item matches', async () => {
      const resultSet = new PostgresResultSet(buildIterator(), row => row.name);
      expect(await resultSet.some(item => item.startsWith('nope'))).toBe(false);
    });

    it('should be false when there are no items', async () => {
      const resultSet = new PostgresResultSet(buildIterator([]), row => row.name);
      expect(await resultSet.some(item => item.startsWith('doc'))).toBe(false);
    });
  });

  describe('indexed()', () => {
    it('should build an index of the whole result set', async () => {
      const resultSet = new PostgresResultSet(buildIterator(), row => row);
      const index = await resultSet.indexed(row => row.name);

      expect(Object.keys(index).length).toBe(6);
      expect(index.doc1).toEqual(testRows[0]);
      expect(index.doc6).toEqual(testRows[5]);
    });
  });

  describe('close()', () => {
    it('should be idempotent', async () => {
      let finishedCount = 0;
      const resultSet = new PostgresResultSet(
        buildIterator(testRows, () => {
          finishedCount += 1;
        }),
        row => row.name
      );
      await resultSet.first(); // starts the generator and closes it
      await resultSet.close(); // second close is a no-op
      expect(finishedCount).toBe(1);
    });

    it('should close the stream even after an early break', async () => {
      let finished = false;
      const resultSet = new PostgresResultSet(
        buildIterator(testRows, () => {
          finished = true;
        }),
        row => row.name
      );
      await resultSet.forEach(item => {
        if (item === 'doc2') {
          return false;
        }
      });
      expect(finished).toBe(true);
    });
  });
});
