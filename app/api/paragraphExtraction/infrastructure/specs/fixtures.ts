import { Document } from '../files.v2/model/Document.js';

import { Segmentation } from '../files.v2/model/Segmentation.js';

import { PXExtractionKey } from '../paragraphExtraction/domain/PXExtractionKey.js';

import { PXExtractor } from '../paragraphExtraction/domain/PXExtractor.js';

import { Property } from '#api/templates.v2/model/Property.js';
import { ObjectId } from 'mongodb';

import { TemplateBuilder } from '#api/core/domain/template/specs/TemplateBuilder.js';
import { GetParagraphsResultDTO } from '../ExternalExtractionService/types';

const mockGetParagraphsResult: GetParagraphsResultDTO = {
  key: PXExtractionKey.create({
    tenantName: 'tenantName',
    userId: 'userId',
    entityStatusId: 'any_extraction_id',
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

const document = new ProcessedPDF({
  id: 'any_id',
  entity: 'any_entity',
  language: 'pt',
  mimetype: 'application/pdf',
  generatedToc: false,
  totalPages: 1,
  creationDate: 1,
  size: 1,
  filename: 'any_file_name',
  originalname: 'original.pdf',
  fullText: {},
  content: new DiskFile('fake/path').toContent(),
});

const document2 = new ProcessedPDF({
  id: 'any_id2',
  entity: 'any_entity2',
  language: 'es',
  mimetype: 'application/pdf',
  generatedToc: false,
  totalPages: 1,
  creationDate: 1,
  size: 1,
  filename: 'any_file_name2',
  originalname: 'original.pdf',
  fullText: {},
  content: new DiskFile('fake/path').toContent(),
});

const sourceTemplate = TemplateBuilder.aTemplate({
  id: 'sourceTemplate',
  name: 'Source template',
}).build();

const paragraphProperty = new Property({
  id: 'any_id',
  type: 'markdown',
  label: 'Rich label',
  template: 'any_id',
});
const paragraphNumberProperty = new Property({
  id: 'paragraphNumberProperty',
  type: 'numeric',
  label: 'Paragraph Number',
  template: 'any_id',
});

const targetTemplate = TemplateBuilder.aTemplate({
  id: 'targetTemplate',
  name: 'Target template',
})
  .withProperties([paragraphProperty, paragraphNumberProperty])
  .build();

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

const sourceRelationshipType = {
  _id: new ObjectId(),
  name: 'Source Relationship Type',
  properties: [],
};

const targetRelationshipType = {
  _id: new ObjectId(),
  name: 'Target Relationship Type',
  properties: [],
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
  sourceRelationshipTypeId: sourceRelationshipType._id.toString(),
  targetRelationshipTypeId: targetRelationshipType._id.toString(),
});

export {
  document,
  document2,
  extractor,
  mockGetParagraphsResult,
  segmentation,
  segmentation2,
  sourceTemplate,
  targetTemplate,
};
