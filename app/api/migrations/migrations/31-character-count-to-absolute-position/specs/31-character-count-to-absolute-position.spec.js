/* eslint-disable no-await-in-loop */

import testingDB from 'api/utils/testing_db';
import errorLog from 'api/log/errorLog';
import { config } from 'api/config';
import { catchErrors } from 'api/utils/jasmineHelpers';
import { connectionId } from 'api/migrations/migrations/31-character-count-to-absolute-position/specs/fixtures';
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

  it('should convert to absolute position', async () => {
    await migration.up(testingDB.mongodb);

    const connections = await testingDB.mongodb
      .collection('connections')
      .find({ _id: connectionId })
      .toArray();

    expect(connections).toEqual([
      expect.objectContaining({
        reference: {
          text: 'SOLICITUD DE INTERPRETACIÓNY PROCEDIMIENTO ANTELA CORTE',
          selectionRectangles: [
            {
              height: 18,
              left: 319,
              pageNumber: 1,
              top: 828,
              width: 280,
              text: 'SOLICITUDDEINTERPRETACIÓN',
            },
            {
              height: 18,
              left: 309,
              pageNumber: 1,
              top: 846,
              width: 304,
              text: 'YPROCEDIMIENTOANTELACORTE',
            },
          ],
        },
      }),
    ]);
  });
});
