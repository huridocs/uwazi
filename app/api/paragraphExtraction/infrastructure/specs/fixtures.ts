import { PXExtractionKey } from 'api/paragraphExtraction/domain/PXExtractionKey';
import { Segmentation } from 'api/files.v2/model/Segmentation';
import { PXExtractor } from 'api/paragraphExtraction/domain/PXExtractor';
import { Property } from 'api/templates.v2/model/Property';
import { Template } from 'api/templates.v2/model/Template';
import { Document } from 'api/files.v2/model/Document';

import { GetParagraphsResultDTO } from '../ExternalExtractionService/types';

const mockGetParagraphsResult: GetParagraphsResultDTO = {
  key: PXExtractionKey.create({
    tenantName: 'tenantName',
    userId: 'userId',
    extractionId: 'any_extraction_id',
  }).key,
  main_language: 'en',
  available_languages: ['en', 'es', 'fr'],
  paragraphs: [
    {
      position: 1,
      translations: [
        {
          language: 'en',
          text: 'This is an example paragraph in English.',
          needs_user_review: false,
        },
        {
          language: 'es',
          text: 'Este es un párrafo de ejemplo en español.',
          needs_user_review: false,
        },
        {
          language: 'fr',
          text: 'Ceci est un paragraphe exemple en français.',
          needs_user_review: true,
        },
      ],
    },
    {
      position: 2,
      translations: [
        {
          language: 'en',
          text: 'This is another example paragraph in English.',
          needs_user_review: false,
        },
        {
          language: 'es',
          text: 'Este es otro párrafo de ejemplo en español.',
          needs_user_review: true,
        },
        {
          language: 'fr',
          text: 'Ceci est un autre paragraphe exemple en français.',
          needs_user_review: false,
        },
      ],
    },
  ],
};

const document = new Document('any_id', 'any_entity', 0, 'any_file_name', 'pt');
const document2 = new Document('any_id2', 'any_entity2', 0, 'any_file_name2', 'es');

const sourceTemplate = new Template('sourceTemplate', 'Source template');

const paragraphProperty = new Property('any_id', 'markdown', 'Rich name', 'Rich label', 'any_id');
const paragraphNumberProperty = new Property(
  'paragraphNumberProperty',
  'numeric',
  'paragraph_number',
  'Paragraph Number',
  'any_id'
);

const targetTemplate = new Template('targetTemplate', 'Target template', [
  paragraphProperty,
  paragraphNumberProperty,
]);

const segmentation: Segmentation = {
  id: 'any_id',
  fileId: document.id,
  filename: document.filename,
  xmlname: document.filename,
  paragraphs: [
    { width: 0, height: 0, left: 0, top: 0, type: 'any_type', text: 'any_text', pageNumber: 0 },
  ],
  status: 'ready',
};

const segmentation2: Segmentation = {
  id: 'any_id2',
  fileId: document2.id,
  filename: document2.filename,
  xmlname: document2.filename,
  paragraphs: [
    { width: 0, height: 0, left: 0, top: 0, type: 'any_type', text: 'any_text', pageNumber: 0 },
  ],
  status: 'ready',
};

const extractor = new PXExtractor({
  id: 'any_id',
  sourceTemplate,
  targetTemplate,
  paragraphNumberPropertyId: paragraphNumberProperty.id,
  paragraphPropertyId: paragraphProperty.id,
});

export {
  mockGetParagraphsResult,
  extractor,
  segmentation,
  document,
  sourceTemplate,
  targetTemplate,
  document2,
  segmentation2,
};
