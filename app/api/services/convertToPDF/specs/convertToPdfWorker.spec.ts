import { config } from 'api/config';
import { files, storage, testingUploadPaths } from 'api/files';
import { tenants } from 'api/tenants';
import testingDB from 'api/utils/testing_db';
// eslint-disable-next-line node/no-restricted-import
import { createReadStream } from 'fs';
import { ObjectId } from 'mongodb';
import Redis from 'redis';
import RedisSMQ from 'rsmq';
import waitForExpect from 'wait-for-expect';
import { convertToPDFService } from '../convertToPdfService';
import { ConvertToPdfWorker } from '../ConvertToPdfWorker';

describe('convertToPdfWorker', () => {
  const worker = new ConvertToPdfWorker();
  beforeAll(async () => {
    await testingDB.connect({ defaultTenant: false });
    await testingDB.setupFixturesAndContext({
      settings: [{ languages: [{ label: 'English', key: 'en' }] }],
      files: [
        {
          entity: 'entity',
          type: 'attachment',
          status: 'processing',
          filename: 'attachment.docx',
        },
      ],
    });

    const tenant1 = {
      name: 'tenant',
      dbName: testingDB.dbName,
      indexName: testingDB.dbName,
      ...(await testingUploadPaths()),
    };

    tenants.add(tenant1);

    const redisUrl = `redis://${config.redis.host}:${config.redis.port}`;
    const redisClient = Redis.createClient(redisUrl);
    const redisSMQ = new RedisSMQ({ client: redisClient });

    try {
      await redisSMQ.deleteQueueAsync({ qname: 'convert-to-pdf_results' });
    } catch (err) {
      if (err instanceof Error && err.name !== 'queueNotFound') {
        throw err;
      }
    }
    await redisSMQ.createQueueAsync({ qname: 'convert-to-pdf_results' });

    const message = {
      params: {
        filename: 'attachment.docx',
        namespace: 'tenant',
      },
      file_url: 'http://localhost:5060/download/converted_attachment.pdf',
    };

    await redisSMQ.sendMessageAsync({
      qname: 'convert-to-pdf_results',
      message: JSON.stringify(message),
    });

    jest
      .spyOn(convertToPDFService, 'download')
      .mockResolvedValue(
        createReadStream(`${__dirname}/../../../files/specs/converted_attachment.pdf`)
      );

    worker.start();
  });

  afterAll(async () => {
    await worker.stop();
  });

  describe('process document', () => {
    it('should maintaint the attachment and remove processing status', async () => {
      await waitForExpect(async () => {
        await tenants.run(async () => {
          const [attachment] = await files.get({ filename: 'attachment.docx' });
          expect(attachment).toEqual({
            _id: expect.any(ObjectId),
            entity: 'entity',
            type: 'attachment',
            filename: 'attachment.docx',
            status: 'ready',
          });
        }, 'tenant');
      });
    });

    it('should add the downloaded pdf file as main document and process it', async () => {
      await waitForExpect(async () => {
        await tenants.run(async () => {
          const [mainDocument] = await files.get(
            { filename: 'converted_attachment.pdf' },
            '+fullText'
          );
          expect(mainDocument).toEqual({
            _id: expect.any(ObjectId),
            creationDate: expect.any(Number),
            entity: 'entity',
            type: 'document',
            filename: 'converted_attachment.pdf',
            status: 'ready',
            fullText: { 1: 'Converted[[1]] pdf[[1]]\n\n' },
            totalPages: 1,
            toc: [],
            language: 'eng',
          });

          expect(storage.fileExists('converted_attachment.pdf', 'document'));
          expect(convertToPDFService.download).toHaveBeenCalledWith(
            new URL('http://localhost:5060/download/converted_attachment.pdf')
          );
          await storage.removeFile('converted_attachment.pdf', 'document');
        }, 'tenant');
      });
    });

    it('should throw on failed result', () => {
      fail();
    });

    it('should send messages to sockets', () => {
      fail();
    });
  });
});
