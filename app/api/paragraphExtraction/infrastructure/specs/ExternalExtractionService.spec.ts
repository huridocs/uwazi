import { Buffer } from 'buffer';
import multer from 'multer';
import express from 'express';
import { Server } from 'http';

import { HttpClientFactory } from 'api/common.v2/infrastructure/HttpClientFactory';
import { FileBuilder } from 'api/files.v2/model/specs/utils/FileBuilder';
import { PXExtractionId } from 'api/paragraphExtraction/domain/PXExtractionId';

import { PXExternalExtractionService } from '../ExternalExtractionService/ExternalExtractionService';
import { document, extractor, mockGetParagraphsResult, segmentation } from './fixtures';

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

      await externalExtractionService.extractParagraph({
        segmentations: [segmentation],
        documents: [document],
        defaultLanguage: 'pt',
        extractionId: PXExtractionId.create({
          entitySharedId: 'any_shared_id',
          extractorId: extractor.id,
        }),
        files: [
          FileBuilder.create().withFilename('file1.txt').build(),
          FileBuilder.create().withFilename('file2.txt').build(),
          FileBuilder.create().withFilename('file3.txt').build(),
        ],
      });

      expect(body).toEqual({
        json_data: JSON.stringify({
          key: 'any_id_____any_shared_id',
          xmls_segments: [
            {
              language: 'pt',
              is_main_language: true,
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
      });

      expect(output).toEqual({
        availableLanguages: ['en', 'es', 'fr'],

        paragraphs: [
          {
            defaultLanguage: 'en',
            extractionId,
            pageNumber: 1,
            translations: [
              {
                language: 'en',
                paragraph: 'This is an example paragraph in English.',
                needsUserReview: false,
              },
              {
                language: 'es',
                paragraph: 'Este es un párrafo de ejemplo en español.',
                needsUserReview: false,
              },
              {
                language: 'fr',
                paragraph: 'Ceci est un paragraphe exemple en français.',
                needsUserReview: true,
              },
            ],
          },
          {
            defaultLanguage: 'en',
            extractionId,
            pageNumber: 2,
            translations: [
              {
                language: 'en',
                paragraph: 'This is another example paragraph in English.',
                needsUserReview: false,
              },
              {
                language: 'es',
                paragraph: 'Este es otro párrafo de ejemplo en español.',
                needsUserReview: true,
              },
              {
                language: 'fr',
                paragraph: 'Ceci est un autre paragraphe exemple en français.',
                needsUserReview: false,
              },
            ],
          },
        ],
      });
    });
  });
});
