import { Buffer } from 'buffer';
import express from 'express';
import { Server } from 'http';
import multer from 'multer';

import { HttpClientFactory } from 'api/common.v2/infrastructure/HttpClientFactory';
import { PXExtractionKey } from 'api/paragraphExtraction/domain/PXExtractionKey';
import { GetParagraphsResultOutput } from 'api/paragraphExtraction/domain/PXExtractionService';

import { FileContents } from 'api/files.v2/model/FileContents';
import { PXExternalExtractionService } from '../ExternalExtractionService/ExternalExtractionService';
import { document, mockGetParagraphsResult, segmentation } from './fixtures';

const upload = multer();
const app = express();
let server: Server;
let body: any;
let files: any;

app.use(express.json());
app.post('/extract_paragraphs', upload.any(), (req, res) => {
  files = req.files;
  body = req.body;
  res.status(200).send('ok');
});

app.get('/paragraphs_results', upload.any(), (_, res) => {
  res.status(200).json(mockGetParagraphsResult);
});

describe('ExternalExtractionService', () => {
  beforeAll(async () => {
    await new Promise<void>(resolve => {
      server = app.listen(5056, resolve);
    });
  });

  afterEach(() => {
    body = undefined;
  });

  afterAll(async () => {
    await new Promise<void>(resolve => {
      server.close(err => {
        if (err) {
          throw err;
        }
        resolve();
      });
    });
  });

  describe('Extract Paragraph', () => {
    it('should call http client with correct params', async () => {
      const externalExtractionService = new PXExternalExtractionService({
        httpClient: HttpClientFactory.createDefault(),
        url: 'http://localhost:5056',
      });

      const extractionKey = PXExtractionKey.create({
        tenantName: 'tenantName',
        userId: 'userId',
        entityStatusId: 'any_extraction_id',
      });

      const streamCallback = jest.fn(async function* () {
        yield Buffer.from('default content');
      });

      await externalExtractionService.extractParagraphs({
        segmentations: [segmentation],
        documents: [document],
        mainLanguage: 'pt',
        extractionKey,
        files: [
          new FileContents({
            filename: 'file1.txt',
            streamCallback,
          }),
          new FileContents({
            filename: 'file2.txt',
            streamCallback,
          }),
          new FileContents({
            filename: 'file3.txt',
            streamCallback,
          }),
        ],
      });

      expect(body).toEqual({
        json_data: JSON.stringify({
          key: extractionKey.key,
          xmls: [
            {
              language: 'pt',
              is_main_language: true,
              xml_file_name: 'any_file_name',
              xml_segments_boxes: [
                { left: 0, top: 0, page_number: 0, segment_type: 'any_type', width: 0, height: 0 },
              ],
            },
          ],
        }),
      });

      expect(files).toEqual([
        {
          fieldname: 'xml_files',
          originalname: 'file1.txt',
          mimetype: 'text/plain',
          encoding: '7bit',
          buffer: expect.any(Buffer),
          size: 15,
        },
        {
          fieldname: 'xml_files',
          originalname: 'file2.txt',
          mimetype: 'text/plain',
          encoding: '7bit',
          buffer: expect.any(Buffer),
          size: 15,
        },
        {
          fieldname: 'xml_files',
          originalname: 'file3.txt',
          mimetype: 'text/plain',
          encoding: '7bit',
          buffer: expect.any(Buffer),
          size: 15,
        },
      ]);
    });
  });

  describe('getParagraphsResult', () => {
    it('should return the correct output', async () => {
      const externalExtractionService = new PXExternalExtractionService({
        httpClient: HttpClientFactory.createDefault(),
        url: 'http://localhost:5056',
      });

      const output = await externalExtractionService.getParagraphsResult(
        'http://localhost:5056/paragraphs_results'
      );

      const extractionId = PXExtractionKey.create({
        tenantName: 'tenantName',
        userId: 'userId',
        entityStatusId: 'any_extraction_id',
      });

      const expectedOutput: GetParagraphsResultOutput = {
        availableLanguages: ['en', 'es', 'fr'],
        mainLanguage: 'en',
        extractionKey: extractionId,
        paragraphs: [
          {
            paragraphNumber: 1,
            translations: [
              {
                language: 'en',
                text: 'This is an example paragraph in English.',
                needsUserReview: false,
                isMainLanguage: true,
              },
              {
                language: 'es',
                text: 'Este es un párrafo de ejemplo en español.',
                needsUserReview: false,
                isMainLanguage: false,
              },
              {
                language: 'fr',
                text: 'Ceci est un paragraphe exemple en français.',
                needsUserReview: true,
                isMainLanguage: false,
              },
            ],
          },
          {
            paragraphNumber: 2,
            translations: [
              {
                language: 'en',
                text: 'This is another example paragraph in English.',
                needsUserReview: false,
                isMainLanguage: true,
              },
              {
                language: 'es',
                text: 'Este es otro párrafo de ejemplo en español.',
                needsUserReview: true,
                isMainLanguage: false,
              },
              {
                language: 'fr',
                text: 'Ceci est un autre paragraphe exemple en français.',
                needsUserReview: false,
                isMainLanguage: false,
              },
            ],
          },
        ],
      };

      expect(output).toEqual(expectedOutput);
    });
  });
});
