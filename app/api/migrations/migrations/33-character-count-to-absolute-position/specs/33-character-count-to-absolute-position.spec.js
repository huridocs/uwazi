/* eslint-disable no-await-in-loop */

import testingDB from 'api/utils/testing_db';
import { legacyLogger } from 'api/log';
import { config } from 'api/config';
import {
  connectionOutOfRangeId,
  connectionToMissingDocumentId,
  documentId,
  documentWithVoidTocId,
  firstConnectionId,
  missingDocumentId,
  secondConnectionId,
} from 'api/migrations/migrations/33-character-count-to-absolute-position/specs/fixtures';

import fixtures from './fixtures.js';
import migration from '../index.js';

describe('conversion of character count to absolute position', () => {
  beforeEach(async () => {
    jest.spyOn(process.stdout, 'write').mockImplementation(() => {});
    jest.spyOn(process.stderr, 'write').mockImplementation(() => {});
    jest.spyOn(legacyLogger, 'error').mockImplementation(() => {});
    config.defaultTenant.uploadedDocuments = __dirname;
    await testingDB.setupFixturesAndContext(fixtures);
  });

  afterAll(done => {
    testingDB.disconnect().then(done);
  });

  it('should have a delta number', () => {
    expect(migration.delta).toEqual(33);
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

    expect(connections[0].reference.selectionRectangles.length).toBeGreaterThanOrEqual(1);
    expect(connections[0].reference.selectionRectangles.length).toBeLessThanOrEqual(2);
    if (connections[0].reference.selectionRectangles.length === 1) {
      expect(connections[0].reference.selectionRectangles[0]).toEqual({
        height: 13,
        left: 29,
        page: '1',
        top: 701,
        width: 355,
      });
    } else {
      expect(connections[0].reference.selectionRectangles[0]).toEqual({
        height: 13,
        left: 29,
        page: '1',
        top: 701,
        width: 27,
      });

      expect(connections[0].reference.selectionRectangles[1]).toEqual({
        height: 13,
        left: 58,
        page: '1',
        top: 701,
        width: 326,
      });
    }
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
              left: 325,
              page: '3',
              top: 641,
              width: 144,
            },
          ],
        },
      }),
    ]);
  });

  it('should manage connection with out of range reference', async () => {
    const output = await migration.up(testingDB.mongodb);

    const connections = await testingDB.mongodb
      .collection('connections')
      .find({ _id: connectionOutOfRangeId })
      .toArray();

    expect(output).toContain(
      'Entity\tundefined\tFile\tmigration33.pdf\tCONNECTION\tno text match\t9999999\t9999999'
    );
    expect(connections[0].reference.text).toEqual('no text match');
    expect(connections[0].reference.selectionRectangles.length).toEqual(1);
    expect(connections[0].reference.selectionRectangles[0].width).toEqual(0);
    expect(connections[0].reference.selectionRectangles[0].height).toEqual(0);
    expect(connections[0].reference.selectionRectangles[0].top).toEqual(0);
    expect(connections[0].reference.selectionRectangles[0].left).toEqual(0);
    expect(connections[0].reference.selectionRectangles[0].page).toEqual('1');
  });

  it('should manage toc with out of range reference', async () => {
    const output = await migration.up(testingDB.mongodb);
    expect(output).toContain('Entity\tentity1\tFile\tmigration33.pdf\tTOC\tWRONG\t99999\t99999');
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
                height: 14,
                left: 330,
                page: '2',
                top: 641,
                width: 134,
              },
            ],
            label: 'PUBLISH WITH PURPOSE',
            indentation: 0,
          },
          {
            selectionRectangles: [
              {
                height: 14,
                left: 325,
                page: '3',
                top: 641,
                width: 144,
              },
            ],
            label: 'BUILD A CUSTOM LIBRARY',
            indentation: 1,
          },
          {
            selectionRectangles: [
              {
                height: 14,
                left: 315,
                page: '4',
                top: 641,
                width: 164,
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
