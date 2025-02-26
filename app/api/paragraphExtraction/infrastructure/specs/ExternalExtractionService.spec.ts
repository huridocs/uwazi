import { Buffer } from 'buffer';
import multer from 'multer';
import express from 'express';
import { Server } from 'http';

import { HttpClientFactory } from 'api/common.v2/infrastructure/HttpClientFactory';
import { FileBuilder } from 'api/files.v2/model/specs/utils/FileBuilder';
import { PXExtractionId } from 'api/paragraphExtraction/domain/PXExtractionId';
import { GetParagraphsResultOutput } from 'api/paragraphExtraction/domain/PXExtractionService';

import { PXExternalExtractionService } from '../ExternalExtractionService/ExternalExtractionService';
import {
  document,
  document2,
  extractor,
  mockGetParagraphsResult,
  segmentation,
  segmentation2,
} from './fixtures';

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

      const extractionId = PXExtractionId.create({
        entitySharedId: 'entitySharedId',
        extractorId: extractor.id,
        tenantName: 'tenantName',
        userId: 'userId',
      });

      await externalExtractionService.extractParagraphs({
        segmentations: [segmentation],
        documents: [document],
        defaultLanguage: 'pt',
        extractionId,
        files: [
          FileBuilder.create().withFilename('file1.txt').build(),
          FileBuilder.create().withFilename('file2.txt').build(),
          FileBuilder.create().withFilename('file3.txt').build(),
        ],
      });

      expect(body).toEqual({
        json_data: JSON.stringify({
          key: extractionId.id,
          xmls: [
            {
              language: 'pt',
              main_language: true,
              xml_file_name: 'any_file_name',
              xml_segments_boxes: [{ left: 0, top: 0, page_number: 0, type: 'any_type' }],
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

    it('should choose the first Document language if default language is not present', async () => {
      const externalExtractionService = new PXExternalExtractionService({
        httpClient: HttpClientFactory.createDefault(),
        url: 'http://localhost:5056',
      });

      const extractionId = PXExtractionId.create({
        entitySharedId: 'entitySharedId',
        extractorId: extractor.id,
        tenantName: 'tenantName',
        userId: 'userId',
      });

      await externalExtractionService.extractParagraphs({
        segmentations: [segmentation, segmentation2],
        documents: [document, document2],
        defaultLanguage: 'en',
        extractionId,
        files: [],
      });

      const payload = JSON.parse(body.json_data);

      expect(payload.xmls).toMatchObject([
        { language: 'pt', main_language: true },
        { language: 'es', main_language: false },
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

      const extractionId = PXExtractionId.create({
        entitySharedId: 'entitySharedId',
        extractorId: 'extractorId',
        tenantName: 'tenantName',
        userId: 'userId',
      });

      const expectedOutput: GetParagraphsResultOutput = {
        availableLanguages: ['en', 'es', 'fr'],
        mainLanguage: 'en',
        extractionId,
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
