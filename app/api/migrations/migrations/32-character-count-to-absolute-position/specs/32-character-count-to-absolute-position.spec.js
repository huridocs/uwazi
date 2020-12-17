/* eslint-disable no-await-in-loop */

import testingDB from 'api/utils/testing_db';
import errorLog from 'api/log/errorLog';
import { config } from 'api/config';
import { catchErrors } from 'api/utils/jasmineHelpers';
import {
  connectionToMissingDocumentId,
  documentId,
  documentWithVoidTocId,
  firstConnectionId,
  missingDocumentId,
  secondConnectionId,
} from 'api/migrations/migrations/32-character-count-to-absolute-position/specs/fixtures';

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
    expect(migration.delta).toEqual(32);
  });

  it('should convert the connections with ranges to absolute position', async () => {
    await migration.up(testingDB.mongodb);

    const connections = await testingDB.mongodb
      .collection('connections')
      .find({ _id: firstConnectionId })
      .toArray();

    expect(connections[0].range).toEqual(undefined);

    expect(connections[0].reference.text).toEqual(
      'Uwazi is an open-source solution for building and sharing document collections'
    );

    expect(connections[0].reference.selectionRectangles[0]).toEqual({
      height: 11,
      left: 28,
      regionId: 1,
      top: 689,
      width: 26,
    });

    expect(connections[0].reference.selectionRectangles[1]).toEqual({
      height: 11,
      left: 55,
      regionId: 1,
      top: 689,
      width: 323,
    });
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
              height: 12,
              left: 318,
              regionId: 3,
              top: 630,
              width: 142,
            },
          ],
        },
      }),
    ]);
  });

  it('should convert table of content to absolute position', async () => {
    await migration.up(testingDB.mongodb);

    const connections = await testingDB.mongodb
      .collection('files')
      .find({ _id: documentId })
      .toArray();

    expect(connections).toEqual([
      expect.objectContaining({
        toc: [
          {
            selectionRectangles: [
              {
                height: 12,
                left: 324,
                regionId: 2,
                top: 630,
                width: 132,
              },
            ],
            label: 'PUBLISH WITH PURPOSE',
            indentation: 0,
          },
          {
            selectionRectangles: [
              {
                height: 12,
                left: 318,
                regionId: 3,
                top: 630,
                width: 142,
              },
            ],
            label: 'BUILD A CUSTOM LIBRARY',
            indentation: 1,
          },
          {
            selectionRectangles: [
              {
                height: 12,
                left: 310,
                regionId: 4,
                top: 630,
                width: 161,
              },
            ],
            label: 'DISCOVER NEW INFORMATION',
            indentation: 2,
          },
        ],
      }),
    ]);
  });

  it('should leave empty toc documents', async () => {
    await migration.up(testingDB.mongodb);

    const files = await testingDB.mongodb
      .collection('files')
      .find({ _id: documentWithVoidTocId })
      .toArray();

    expect(files[0].toc).toEqual([]);
  });

  it('should empty toc and connections ranges when document fails', async () => {
    await migration.up(testingDB.mongodb);

    const files = await testingDB.mongodb
      .collection('files')
      .find({ _id: missingDocumentId })
      .toArray();

    const connections = await testingDB.mongodb
      .collection('connections')
      .find({ _id: connectionToMissingDocumentId })
      .toArray();

    expect(files[0].toc).toMatchObject([]);
    expect(connections[0].range).toEqual(undefined);
    expect(connections[0].file).toEqual(undefined);
  });
});
