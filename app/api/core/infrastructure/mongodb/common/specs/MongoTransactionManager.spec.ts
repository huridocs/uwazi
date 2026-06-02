/* eslint-disable max-classes-per-file */
import { MongoClient, MongoError } from 'mongodb';
import { getIdMapper } from '#api/utils/fixturesFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import testingDB from '#api/utils/testing_db.js';
import { StandardLogger } from '#api/core/libs/logger/infrastructure/StandardLogger.js';
import { getClient, getTenant } from '../getConnectionForCurrentTenant.js';
import { MongoTransactionManager } from '../MongoTransactionManager.js';
import { OptimisticLockError } from '../OptimisticLockError.js';

const ids = getIdMapper();

const fixtures = {
  collection1: [{ _id: ids('doc1'), name: 'doc1' }],
  collection2: [{ _id: ids('doc2'), name: 'doc2' }],
};

beforeEach(async () => {
  await testingEnvironment.setUp(fixtures);
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});

abstract class TestBase {
  protected tm: MongoTransactionManager;

  constructor(tm: MongoTransactionManager) {
    this.tm = tm;
  }
}

class Transactional1 extends TestBase {
  async do() {
    await testingDB.mongodb
      ?.collection('collection1')
      .insertOne({ _id: ids('doc3'), name: 'doc3' }, { session: this.tm.getSession() });
    await testingDB.mongodb
      ?.collection('collection1')
      .updateOne(
        { _id: ids('doc1') },
        { $set: { updated: true } },
        { session: this.tm.getSession() }
      );
  }
}

class Transactional2 extends TestBase {
  async do() {
    await testingDB.mongodb
      ?.collection('collection2')
      .deleteOne({ _id: ids('doc2') }, { session: this.tm.getSession() });
  }
}

class Transactional3 extends TestBase {
  async do() {
    return testingDB
      .mongodb!.collection('collection1')
      .find({ _id: ids('doc1') }, { session: this.tm.getSession() })
      .toArray();
  }
}

const createTransactionManager = (client?: MongoClient) =>
  new MongoTransactionManager(client ?? getClient(), new StandardLogger(() => {}, getTenant()));

describe('When every operation goes well', () => {
  it('should be reflected in all of the collections affected', async () => {
    const transactionManager = createTransactionManager();
    const source1 = new Transactional1(transactionManager);
    const source2 = new Transactional2(transactionManager);
    const source3 = new Transactional3(transactionManager);
    await transactionManager.run(async () => {
      await source1.do();
      await source2.do();
      await source3.do();
    });

    const col1 = await testingDB.mongodb?.collection('collection1').find({}).toArray();
    const col2 = await testingDB.mongodb?.collection('collection2').find({}).toArray();

    expect(col1).toEqual([
      { _id: ids('doc1'), name: 'doc1', updated: true },
      { _id: ids('doc3'), name: 'doc3' },
    ]);

    expect(col2).toEqual([]);
  });

  it('should be able to perform different transactions one after another', async () => {
    const transactionManager = createTransactionManager();
    const source1 = new Transactional1(transactionManager);
    const source2 = new Transactional2(transactionManager);
    const source3 = new Transactional3(transactionManager);
    await transactionManager.run(async () => {
      await source1.do();
    });

    await transactionManager.run(async () => {
      await source2.do();
      await source3.do();
    });

    const col1 = await testingDB.mongodb?.collection('collection1').find({}).toArray();
    const col2 = await testingDB.mongodb?.collection('collection2').find({}).toArray();

    expect(col1).toEqual([
      { _id: ids('doc1'), name: 'doc1', updated: true },
      { _id: ids('doc3'), name: 'doc3' },
    ]);

    expect(col2).toEqual([]);
  });
});

describe('When one operation fails', () => {
  // eslint-disable-next-line max-statements
  it('should not write any changes to the database and re-throw the error', async () => {
    const transactionManager = createTransactionManager();
    const error = new Error('Simulated error');
    const source1 = new Transactional1(transactionManager);
    const source2 = new Transactional2(transactionManager);
    try {
      await transactionManager.run(async () => {
        await source1.do();
        throw error; // Mimics error thrown mid-execution
        // eslint-disable-next-line no-unreachable
        await source2.do();
      });
    } catch (e) {
      expect(e).toBe(error);
    }

    const col1 = await testingDB.mongodb?.collection('collection1').find({}).toArray();
    const col2 = await testingDB.mongodb?.collection('collection2').find({}).toArray();

    expect(col1).toEqual(fixtures.collection1);
    expect(col2).toEqual(fixtures.collection2);
  });

  it('should not try to abort the transaction if the server already did', async () => {
    class Transactional4 extends TestBase {
      async do() {
        await testingDB.mongodb
          ?.collection('collection1')
          .updateOne(
            { name: 'doc1' },
            { $set: { name: 'doc3' } },
            { session: this.tm.getSession() }
          );

        try {
          await testingDB.mongodb
            ?.collection('collection1')
            .insertOne({ name: 'doc3' }, { session: this.tm.getSession() });
        } catch (e) {
          // Ignores the error for the sake of testing.
        }
      }
    }

    await testingDB.mongodb?.collection('collection1').createIndex({ name: 1 }, { unique: true });

    const tm = createTransactionManager();
    const transactional = new Transactional4(tm);

    try {
      await tm.run(async () => {
        await transactional.do();
      });
    } catch (e) {
      await expect(e.message).not.toMatch(
        'Cannot call abortTransaction after calling commitTransaction'
      );
      expect(e.codeName).toEqual('NoSuchTransaction');
      expect(e.code).toBe(251);
    }
  });
});

describe('when calling run() when a transaction is running', () => {
  const cases = [
    {
      cb: async (transactionManager: MongoTransactionManager) =>
        transactionManager.run(async () => {
          await transactionManager.run(async () => Promise.resolve());
        }),
      name: 'nested',
    },
    {
      cb: async (transactionManager: MongoTransactionManager) =>
        Promise.all([
          transactionManager.run(
            async () =>
              new Promise(resolve => {
                setTimeout(resolve, 100);
              })
          ),
          new Promise<void>((resolve, reject) => {
            setTimeout(() => {
              transactionManager
                .run(async () => {})
                .then(resolve)
                .catch(reject);
            }, 50);
          }),
        ]),
    },
  ];

  it.each<(typeof cases)[number]>(cases)(
    'should throw "transaction in progress"',
    async ({ cb }) => {
      const transactionManager = createTransactionManager();

      try {
        await cb(transactionManager);
      } catch (e) {
        await expect(e.message).toMatch('progress');
      }
    }
  );
});

describe('when calling run() after the transaction was commited', () => {
  it('should throw "transaction finished"', async () => {
    const transactionManager = createTransactionManager();

    try {
      await transactionManager.run(async () => Promise.resolve());
      await transactionManager.run(async () => Promise.resolve());
    } catch (e) {
      await expect(e.message).toMatch('finished');
    }
  });
});

describe('when registering onCommitted event handlers within the run() callback', () => {
  it('should trigger the handlers after committing', async () => {
    const transactionManager = createTransactionManager();

    const checkpoints = [1];

    await transactionManager.run(async () => {
      checkpoints.push(2);
      transactionManager.onCommitted(async () => {
        checkpoints.push(6);
      });
      await new Promise<void>(resolve => {
        setTimeout(() => {
          checkpoints.push(4);
          transactionManager.onCommitted(async () => {
            checkpoints.push(6);
          });
          resolve();
        }, 50);
        checkpoints.push(3);
      });
      checkpoints.push(5);
    });

    expect(checkpoints).toEqual([1, 2, 3, 4, 5, 6, 6]);
  });

  it('should not trigger the handlers if aborted', async () => {
    const transactionManager = createTransactionManager();

    const checkpoints = [1];

    try {
      await transactionManager.run(async () => {
        checkpoints.push(2);
        transactionManager.onCommitted(async () => {
          checkpoints.push(6);
        });
        await new Promise<void>((_resolve, reject) => {
          setTimeout(() => {
            checkpoints.push(4);
            transactionManager.onCommitted(async () => {
              checkpoints.push(6);
            });
            reject(new Error('expected'));
          }, 50);
          checkpoints.push(3);
        });
      });

      fail('should have failed');
    } catch (e) {
      expect(e.message).toBe('expected');
      expect(checkpoints).toEqual([1, 2, 3, 4]);
    }
  });

  it('should manually trigger the onCommit handlers', async () => {
    const transactionManager = createTransactionManager();

    const checkpoints = [1];

    transactionManager.onCommitted(async () => {
      checkpoints.push(2);
    });

    transactionManager.onCommitted(async () => {
      checkpoints.push(3);
    });

    await transactionManager.executeOnCommitHandlers(undefined);

    expect(checkpoints).toEqual([1, 2, 3]);
  });

  it('should not leak onCommitted handlers to subsequent runs', async () => {
    const transactionManager = createTransactionManager();
    const runHandler = jest.fn().mockResolvedValue(undefined);

    await transactionManager.run(async () => {
      transactionManager.onCommitted(runHandler);
    });

    await transactionManager.run(async () => {});

    expect(runHandler).toHaveBeenCalledTimes(1);
  });
});

describe('when registering onCommitted handlers outside a transaction', () => {
  it('should execute persistent handlers on every run', async () => {
    const transactionManager = createTransactionManager();
    const persistentHandler = jest.fn().mockResolvedValue(undefined);
    transactionManager.onCommitted(persistentHandler);

    await transactionManager.run(async () => {});
    await transactionManager.run(async () => {});

    expect(persistentHandler).toHaveBeenCalledTimes(2);
  });
});

describe('when registering onCommitted event handlers with the runHandlingOnCommited() call', () => {
  it('should trigger the handlers with the result after committing', async () => {
    const transactionManager = createTransactionManager();

    const checkpoints = [1];
    let transactionResult: string = '';

    await transactionManager
      .runHandlingOnCommitted(async () => {
        checkpoints.push(2);
        transactionManager.onCommitted(async () => {
          checkpoints.push(4);
        });
        checkpoints.push(3);
        return 'transaction result';
      })
      .onCommitted(async result => {
        transactionResult = result;
        checkpoints.push(4);
      });

    expect(checkpoints).toEqual([1, 2, 3, 4, 4]);
    expect(transactionResult).toBe('transaction result');
  });
});

// https://www.mongodb.com/docs/manual/core/transactions-in-applications/#std-label-transient-transaction-error
describe('when the some operation throws a TransientTransactionError', () => {
  it('should retry the whole transaction', async () => {
    const transactionManager = createTransactionManager();

    let throwed = false;
    const checkpoints: number[] = [];
    await transactionManager
      .runHandlingOnCommitted(async () => {
        checkpoints.push(1);
        if (!throwed) {
          const error = new MongoError('TransientTransactionError');
          error.addErrorLabel('TransientTransactionError');
          throwed = true;
          throw error;
        }
      })
      .onCommitted(async () => {
        checkpoints.push(2);
      });

    expect(checkpoints).toEqual([1, 1, 2]);
  });

  it('should retry the transaction a finite amount of times', async () => {
    const transactionManager = createTransactionManager();
    const errors: Error[] = [];
    try {
      await transactionManager.run(async () => {
        const error = new MongoError('TransientTransactionError');
        error.addErrorLabel('TransientTransactionError');
        errors.push(error);
        throw error;
      });
    } catch (e) {
      expect(e).toBe(errors[errors.length - 1]);
      expect(errors.length).toBe(4);
    }
  });
});

// https://www.mongodb.com/docs/manual/core/transactions-in-applications/#unknowntransactioncommitresult
describe('when the commit operation throws a UnknownTransactionCommitResult', () => {
  it('should retry the commit', async () => {
    let throwed = false;
    const commitTransactionMock = jest.fn().mockImplementation(async () => {
      if (!throwed) {
        throwed = true;
        const error = new MongoError('UnknownTransactionCommitResult');
        error.addErrorLabel('UnknownTransactionCommitResult');
        throw error;
      }
    });
    const clientMock = {
      startSession: () => ({
        commitTransaction: commitTransactionMock,
        startTransaction: async () => {},
        abortTransaction: async () => {},
        endSession: () => {},
      }),
    };
    const transactionManager = createTransactionManager(clientMock as any);

    const checkpoints: number[] = [];
    await transactionManager
      .runHandlingOnCommitted(async () => {
        checkpoints.push(1);
      })
      .onCommitted(async () => {
        checkpoints.push(2);
      });

    expect(checkpoints).toEqual([1, 2]);
    expect(commitTransactionMock).toHaveBeenCalledTimes(2);
  });
});

describe('when registering onRetry event handlers', () => {
  it('should call the handler when a TransientTransactionError causes a retry', async () => {
    const transactionManager = createTransactionManager();
    const retryHandler = jest.fn().mockResolvedValue(undefined);
    transactionManager.onRetry(retryHandler);

    let throwed = false;
    await transactionManager.run(async () => {
      if (!throwed) {
        const error = new MongoError('TransientTransactionError');
        error.addErrorLabel('TransientTransactionError');
        throwed = true;
        throw error;
      }
    });

    expect(retryHandler).toHaveBeenCalledTimes(1);
  });

  it('should call the handler when an OptimisticLockError causes a retry', async () => {
    const transactionManager = createTransactionManager();
    const retryHandler = jest.fn().mockResolvedValue(undefined);
    transactionManager.onRetry(retryHandler);

    let throwed = false;
    await transactionManager.run(async () => {
      if (!throwed) {
        throwed = true;
        throw new OptimisticLockError({
          resourceName: 'Test',
          expectedVersion: 1,
          resourceId: 'id',
        });
      }
    });

    expect(retryHandler).toHaveBeenCalledTimes(1);
  });

  it('should not call the handler when the transaction succeeds without retry', async () => {
    const transactionManager = createTransactionManager();
    const retryHandler = jest.fn().mockResolvedValue(undefined);
    transactionManager.onRetry(retryHandler);

    await transactionManager.run(async () => {});

    expect(retryHandler).not.toHaveBeenCalled();
  });

  it('should call the handler multiple times when multiple retries occur', async () => {
    const transactionManager = createTransactionManager();
    const retryHandler = jest.fn().mockResolvedValue(undefined);
    transactionManager.onRetry(retryHandler);

    let throwCount = 0;
    await transactionManager.run(async () => {
      if (throwCount < 2) {
        // eslint-disable-next-line no-plusplus
        throwCount++;
        throw new OptimisticLockError({
          resourceName: 'Test',
          expectedVersion: 1,
          resourceId: 'id',
        });
      }
    });

    expect(retryHandler).toHaveBeenCalledTimes(2);
  });

  it('should manually trigger onRetry handlers via executeOnRetryHandlers()', async () => {
    const transactionManager = createTransactionManager();
    const checkpoints = [1];

    transactionManager.onRetry(async () => {
      checkpoints.push(2);
    });

    await transactionManager.executeOnRetryHandlers();

    expect(checkpoints).toEqual([1, 2]);
  });

  it('should not leak run-scoped retry handlers to subsequent runs', async () => {
    const transactionManager = createTransactionManager();
    const retryHandler = jest.fn().mockResolvedValue(undefined);

    let firstRunThrowed = false;
    await transactionManager.run(async () => {
      transactionManager.onRetry(retryHandler);
      if (!firstRunThrowed) {
        firstRunThrowed = true;
        const error = new MongoError('TransientTransactionError');
        error.addErrorLabel('TransientTransactionError');
        throw error;
      }
    });

    let secondRunThrowed = false;
    await transactionManager.run(async () => {
      if (!secondRunThrowed) {
        secondRunThrowed = true;
        const error = new MongoError('TransientTransactionError');
        error.addErrorLabel('TransientTransactionError');
        throw error;
      }
    });

    expect(retryHandler).toHaveBeenCalledTimes(1);
  });
});

describe('when the operation throws a OptimisticLockError', () => {
  const makeWriteConflictError = () => {
    const error = new OptimisticLockError({
      resourceName: 'Test',
      expectedVersion: 1,
      resourceId: 'testId',
    });

    return error;
  };

  it('retries on OptimisticLockError and succeeds on the second attempt', async () => {
    const transactionManager = createTransactionManager();

    let throwed = false;
    const checkpoints: number[] = [];
    await transactionManager.run(async () => {
      checkpoints.push(1);
      if (!throwed) {
        throwed = true;
        throw makeWriteConflictError();
      }
    });

    expect(checkpoints).toEqual([1, 1]);
  });

  it('re-throws after MAX_RETRIES consecutive WriteConflicts', async () => {
    const transactionManager = createTransactionManager();
    const errors: Error[] = [];

    try {
      await transactionManager.run(async () => {
        const error = makeWriteConflictError();
        errors.push(error);
        throw error;
      });
    } catch (e) {
      expect(e).toBe(errors[errors.length - 1]);
      expect(errors.length).toBe(4); // 1 initial + 3 retries
    }
  });

  it('does not retry on MongoErrors with other codes', async () => {
    const transactionManager = createTransactionManager();
    let callCount = 0;
    const otherError = new MongoError('SomeOtherError');
    (otherError as any).code = 999;

    try {
      await transactionManager.run(async () => {
        // eslint-disable-next-line no-plusplus
        callCount++;
        throw otherError;
      });
    } catch (e) {
      expect(e).toBe(otherError);
      expect(callCount).toBe(1);
    }
  });
});
