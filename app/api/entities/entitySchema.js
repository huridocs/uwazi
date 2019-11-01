import Ajv from 'ajv';

const ajv = Ajv({ allErrors: true });

const schema = {
  $schema: 'http://json-schema.org/schema#',
  type: 'object',
  required: ['title'],
  properties: {
    _id: { type: 'string' },
    sharedId: { type: 'string' },
    language: { type: 'string' },
    mongoLanguage: { type: 'string' },
    title: { type: 'string' },
    template: { type: 'string' },
    file: {
      type: 'object',
      properties: {
        originalname: 'string',
        filename: 'string',
        mimetype: 'string',
        size: 'number',
        timestamp: 'number',
        language: 'string'
      }
    },
    fullText: { type: 'object' },
    totalPage: { type: 'number' },
    icon: {
      type: 'object',
      properties: {
        _id: { type: 'string' },
        label: { type: 'string' },
        type: { type: 'string' }
      }
    },
    toc: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          label: { type: 'string' },
          indentation: { type: 'number' },
          range: {
            type: 'object',
            properties: {
              start: { type: 'number' },
              end: { type: 'number' }
            }
          }
        }
      }
    },
    attachments: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          originalname: { type: 'string' },
          filename: { type: 'string' },
          mimetype: { type: 'string' },
          timestamp: { type: 'number' },
          size: { type: 'number' }
        }
      }
    },
    creationDate: { type: 'number' },
    processed: { type: 'boolean' },
    uploaded: { type: 'boolean' },
    published: { type: 'boolean' },
    pdfInfo: { type: 'object' },
    user: { type: 'string' },
    metadata: {
      type: 'object',
      additionalProperties: {
        oneOf: [
          { type: 'string' },
          { type: 'number' },
          {
            type: 'array',
            items: {
              type: 'string'
            }
          },
          {
            type: 'array',
            items: {
              type: 'object',
              required: ['lon', 'lat'],
              properties: {
                label: { type: 'string' },
                lat: { type: 'number', minimum: -90, maximum: 90 },
                lon: { type: 'number', minimum: -180, maximum: 180 }
              }
            }
          }
        ]
      }
    },
  }
};

const validateEntity = ajv.compile(schema);

export {
  validateEntity
};
