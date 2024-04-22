import Ajv from 'ajv';
import { objectIdSchema } from 'shared/types/commonSchemas';
import { wrapValidator } from 'shared/tsUtils';
import { SegmentationType } from './segmentationType';

export const emitSchemaTypes = true;

const ajv = new Ajv({ allErrors: true, removeAdditional: true });
ajv.addVocabulary(['tsType']);

export const paragraphSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    left: { type: 'number' },
    top: { type: 'number' },
    width: { type: 'number' },
    height: { type: 'number' },
    page_number: { type: 'number' },
    text: { type: 'string' },
  },
};

export const paragraphsSchema = {
  type: 'array',
  definitions: { paragraphSchema },
  items: paragraphSchema,
};

export const segmentationSchema = {
  $schema: 'http://json-schema.org/schema#',
  $async: true,
  type: 'object',
  additionalProperties: false,
  title: 'SegmentationType',
  definitions: { objectIdSchema, paragraphsSchema },
  properties: {
    _id: objectIdSchema,
    autoexpire: { oneOf: [{ type: 'number' }, { type: 'null' }] },
    fileID: objectIdSchema,
    filename: { type: 'string', minLength: 1 },
    xmlname: { type: 'string', minLength: 1 },
    status: { type: 'string', enum: ['processing', 'failed', 'ready'] },
    segmentation: {
      type: 'object',
      additionalProperties: false,
      properties: {
        page_width: { type: 'number' },
        page_height: { type: 'number' },
        paragraphs: paragraphsSchema,
      },
    },
  },
};

const validate = wrapValidator(ajv.compile(segmentationSchema));

export const validateFile = async (file: SegmentationType): Promise<SegmentationType> =>
  validate({ ...file });
