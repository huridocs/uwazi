/* eslint-disable no-await-in-loop */

import testingDB from 'api/utils/testing_db';
import errorLog from 'api/log/errorLog';
import { config } from 'api/config';
import { catchErrors } from 'api/utils/jasmineHelpers';
import {
  firstConnectionId,
  secondConnectionId,
} from 'api/migrations/migrations/31-character-count-to-absolute-position/specs/fixtures';
import fixtures from './fixtures.js';
import migration from '../index.js';

describe('conversion of character count to absolute position', () => {
  beforeEach(done => {
    spyOn(process.stdout, 'write');
    spyOn(errorLog, 'error');
    config.defaultTenant.uploadedDocuments = __dirname;
    testingDB
      .clearAllAndLoad(fixtures)
      .then(done)
      .catch(catchErrors(done));
  });

  afterAll(done => {
    testingDB.disconnect().then(done);
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(31);
  });

  it('should convert the connections with ranges to absolute position', async () => {
    await migration.up(testingDB.mongodb);

    const connections = await testingDB.mongodb
      .collection('connections')
      .find({ _id: firstConnectionId })
      .toArray();

    expect(connections).toEqual([
      expect.objectContaining({
        reference: {
          text: 'Uwazi is an open-source solution for building and sharing document collections',
          selectionRectangles: [
            {
              height: 13,
              left: 32,
              pageNumber: 1,
              top: 790,
              width: 30,
            },
            {
              height: 13,
              left: 63,
              pageNumber: 1,
              top: 790,
              width: 370,
            },
          ],
        },
      }),
    ]);
  });

  it('should convert the connections from other page', async () => {
    await migration.up(testingDB.mongodb);

    const connections = await testingDB.mongodb
      .collection('connections')
      .find({ _id: secondConnectionId })
      .toArray();

    expect(connections).toEqual([
      expect.objectContaining({
        reference: {
          text: 'BUILD A CUSTOM LIBRARY',
          selectionRectangles: [
            {
              height: 14,
              left: 365,
              pageNumber: 3,
              top: 722,
              width: 163,
            },
          ],
        },
      }),
    ]);
  });
});
