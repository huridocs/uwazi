// eslint-disable-next-line node/no-restricted-import
import { createReadStream } from 'fs';
import { config } from 'api/config';
import { files, storage, testingUploadPaths } from 'api/files';
import { tenants } from 'api/tenants';
import testingDB from 'api/utils/testing_db';
import { permissionsContext } from 'api/permissions/permissionsContext';
import * as setupSockets from 'api/socketio/setupSockets';
import * as handleError from 'api/utils/handleError.js';
import { ObjectId } from 'mongodb';
import Redis from 'redis';
import RedisSMQ from 'rsmq';
import waitForExpect from 'wait-for-expect';
import { convertToPDFService } from '../convertToPdfService';
import { ConvertToPdfWorker } from '../ConvertToPdfWorker';

describe('convertToPdfWorker', () => {
  const worker = new ConvertToPdfWorker();
  const redisUrl = `redis://${config.redis.host}:${config.redis.port}`;
  const redisClient = Redis.createClient(redisUrl);
  const redisSMQ = new RedisSMQ({ client: redisClient });

  const recreateRedisQueue = async () => {
    try {
      await redisSMQ.deleteQueueAsync({ qname: 'development_convert-to-pdf_results' });
    } catch (err) {
      if (err instanceof Error && err.name !== 'queueNotFound') {
        throw err;
      }
    }
    await redisSMQ.createQueueAsync({ qname: 'development_convert-to-pdf_results' });
  };

  beforeAll(async () => {
    await testingDB.connect({ defaultTenant: false });
    jest.spyOn(setupSockets, 'emitToTenant').mockImplementation(() => {});
    await testingDB.setupFixturesAndContext({
      settings: [
        {
          features: { convertToPdf: { active: true, url: 'http://localhost:5060' } },
          languages: [{ label: 'English', key: 'en' }],
        },
      ],
      files: [
        {
          entity: 'entity',
          type: 'attachment',
          status: 'processing',
          filename: 'attachment.docx',
          originalname: 'attachment.docx',
        },
      ],
    });

    tenants.add({
      name: 'tenant',
      dbName: testingDB.dbName,
      indexName: testingDB.dbName,
      ...(await testingUploadPaths()),
    });

    await recreateRedisQueue();

    jest
      .spyOn(convertToPDFService, 'download')
      .mockResolvedValue(
        createReadStream(`${__dirname}/../../../files/specs/converted_attachment.pdf`)
      );

    jest.spyOn(permissionsContext, 'setCommandContext');
    worker.start(0);
  });

  afterAll(async () => {
    redisClient.end(true);
    await testingDB.disconnect();
    await worker.stop();
  });

  describe('process document', () => {
    beforeAll(async () => {
      const message = {
        params: {
          filename: 'attachment.docx',
          namespace: 'tenant',
        },
        file_url: 'http://localhost:5060/download/converted_attachment.pdf',
      };

      await redisSMQ.sendMessageAsync({
        qname: 'development_convert-to-pdf_results',
        message: JSON.stringify(message),
      });
    });

    it('needs permissions to get entities associated to the file', async () => {
      await waitForExpect(() => {
        expect(permissionsContext.setCommandContext).toHaveBeenCalled();
      });
    });

    it('should maintaint the attachment and remove processing status', async () => {
      await waitForExpect(async () => {
        await tenants.run(async () => {
          const [attachment] = await files.get({ filename: 'attachment.docx' });
          expect(attachment).toEqual({
            _id: expect.any(ObjectId),
            entity: 'entity',
            type: 'attachment',
            filename: 'attachment.docx',
            originalname: 'attachment.docx',
            status: 'ready',
          });
        }, 'tenant');
      });
    });

    it('should add the downloaded pdf file as main document and process it', async () => {
      await waitForExpect(async () => {
        await tenants.run(async () => {
          const [mainDocument] = await files.get({ type: 'document' }, '+fullText');
          expect(mainDocument).toEqual({
            _id: expect.any(ObjectId),
            creationDate: expect.any(Number),
            entity: 'entity',
            type: 'document',
            mimetype: 'application/pdf',
            filename: expect.stringMatching('.pdf'),
            originalname: 'attachment.pdf',
            status: 'ready',
            fullText: { 1: 'Converted[[1]] pdf[[1]]\n\n' },
            totalPages: 1,
            toc: [],
            language: 'eng',
          });

          expect(
            (await storage.fileContents(mainDocument.filename || '', 'document')).toString()
          ).not.toEqual('');
          expect(convertToPDFService.download).toHaveBeenCalledWith(
            new URL('http://localhost:5060/download/converted_attachment.pdf')
          );
        }, 'tenant');
      });
    });

    it('should emit a documentProcessed socket event to the tenant', async () => {
      await waitForExpect(async () => {
        expect(setupSockets.emitToTenant).toHaveBeenCalledWith(
          'tenant',
          'documentProcessed',
          'entity'
        );
      });
    });
  });

  describe('on error', () => {
    it('should throw with error message', async () => {
      const message = { success: false, error_message: 'error converting !' };

      jest.spyOn(handleError, 'handleError').mockImplementationOnce(() => {});

      await redisSMQ.sendMessageAsync({
        qname: 'development_convert-to-pdf_results',
        message: JSON.stringify(message),
      });

      await waitForExpect(async () => {
        expect(handleError.handleError).toHaveBeenCalledWith(new Error('error converting !'), {
          useContext: false,
        });
      });
    });
  });
});
